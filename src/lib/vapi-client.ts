/**
 * Vapi Client Wrapper
 * Provides typed methods for interacting with Vapi API
 */

import { VapiClient } from "@vapi-ai/server-sdk";
import { ASSISTANT_IDS, type AssistantKey } from "../assistants/index.js";
import { PHONE_NUMBERS, type PhoneNumberKey } from "../config/defaults.js";
import type {
	AssistantConfig,
	Call,
	CreateCallParams,
	SDRCallEvaluation,
} from "../types/index.js";

// ============================================================================
// Client Initialization
// ============================================================================

let client: VapiClient | null = null;

export function getClient(): VapiClient {
	if (!client) {
		const token = process.env.VAPI_API_KEY;
		if (!token) {
			throw new Error("VAPI_API_KEY environment variable is required");
		}
		client = new VapiClient({ token });
	}
	return client;
}

// ============================================================================
// Assistant Operations
// ============================================================================

export interface AssistantSummary {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt?: Date;
}

export async function listAssistants(): Promise<AssistantSummary[]> {
	const vapi = getClient();
	const assistants = await vapi.assistants.list();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return assistants.map((a: any) => ({
		id: a.id as string,
		name: a.name as string,
		createdAt: new Date(a.createdAt as string),
		updatedAt: a.updatedAt ? new Date(a.updatedAt as string) : undefined,
	}));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAssistantDetails(assistantId: string): Promise<any> {
	const vapi = getClient();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return await (vapi.assistants as any).get(assistantId);
}

export async function updateAssistant(
	assistantId: string,
	config: Partial<AssistantConfig>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const vapi = getClient();
	// SDK expects id to be included in the request object
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return await (vapi.assistants as any).update({ id: assistantId, ...config });
}

export async function createAssistant(
	config: AssistantConfig,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
	const vapi = getClient();
	const { id: _id, ...configWithoutId } = config;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return await vapi.assistants.create(configWithoutId as any);
}

// ============================================================================
// Phone Number Operations
// ============================================================================

export interface PhoneNumberSummary {
	id: string;
	number: string;
	name?: string;
	status: string;
	assistantId?: string;
}

export async function listPhoneNumbers(): Promise<PhoneNumberSummary[]> {
	const vapi = getClient();
	const phones = await vapi.phoneNumbers.list();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return phones.map((p: any) => ({
		id: p.id as string,
		number: p.number as string,
		name: p.name as string | undefined,
		status: p.status as string,
		assistantId: p.assistantId as string | undefined,
	}));
}

// ============================================================================
// Call Operations
// ============================================================================

export interface CreateCallOptions {
	customerNumber: string;
	assistantKey?: AssistantKey;
	assistantId?: string;
	phoneKey?: PhoneNumberKey;
	phoneNumberId?: string;
	scheduledAt?: Date;
}

export async function createCall(options: CreateCallOptions): Promise<Call> {
	const vapi = getClient();

	// Resolve assistant ID
	const assistantId =
		options.assistantId ||
		(options.assistantKey
			? ASSISTANT_IDS[options.assistantKey]
			: ASSISTANT_IDS["joey-optimized"]);

	// Resolve phone number ID
	const phoneNumberId =
		options.phoneNumberId ||
		(options.phoneKey
			? PHONE_NUMBERS[options.phoneKey].id
			: PHONE_NUMBERS.joeyOptimized.id);

	const params: CreateCallParams = {
		assistantId,
		phoneNumberId,
		customer: {
			number: options.customerNumber,
		},
	};

	// Add schedule if provided
	if (options.scheduledAt) {
		params.schedulePlan = {
			earliestAt: options.scheduledAt.toISOString(),
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const call: any = await vapi.calls.create(params as any);

	return {
		id: call.id as string,
		status: call.status as string,
		duration: call.duration as number | undefined,
		endedReason: call.endedReason as string | undefined,
		createdAt: call.createdAt as string,
		analysis: call.analysis as Call["analysis"],
		transcript: call.transcript as string | undefined,
		artifact: call.artifact as Call["artifact"],
	};
}

export async function listCalls(limit: number = 10): Promise<Call[]> {
	const vapi = getClient();
	const calls = await vapi.calls.list({ limit });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return calls.map((c: any) => ({
		id: c.id as string,
		status: c.status as string,
		duration: c.duration as number | undefined,
		endedReason: c.endedReason as string | undefined,
		createdAt: c.createdAt as string,
		analysis: c.analysis as Call["analysis"],
		transcript: c.transcript as string | undefined,
		artifact: c.artifact as Call["artifact"],
	}));
}

export async function getCallDetails(callId: string): Promise<Call> {
	const vapi = getClient();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const call: any = await (vapi.calls as any).get(callId);

	return {
		id: call.id as string,
		status: call.status as string,
		duration: call.duration as number | undefined,
		endedReason: call.endedReason as string | undefined,
		createdAt: call.createdAt as string,
		analysis: call.analysis as Call["analysis"],
		transcript: call.transcript as string | undefined,
		artifact: call.artifact as Call["artifact"],
	};
}

// ============================================================================
// Analysis Operations
// ============================================================================

export interface CallAnalysisResult {
	callId: string;
	summary?: string;
	successScore?: number;
	evaluation?: SDRCallEvaluation;
	transcript?: string;
}

export async function getCallAnalysis(
	callId: string,
): Promise<CallAnalysisResult> {
	const call = await getCallDetails(callId);

	const result: CallAnalysisResult = {
		callId,
		transcript: call.transcript,
	};

	if (call.analysis) {
		result.summary = call.analysis.summary;
		result.successScore = call.analysis.successEvaluation;

		// Extract structured evaluation data
		if (call.artifact?.structuredOutputs) {
			const outputs = Object.values(call.artifact.structuredOutputs);
			if (outputs.length > 0) {
				result.evaluation = outputs[0].result as SDRCallEvaluation;
			}
		}
	}

	return result;
}

// Wait for call analysis to be ready (polls until available)
export async function waitForCallAnalysis(
	callId: string,
	maxWaitMs: number = 30000,
	pollIntervalMs: number = 2000,
): Promise<CallAnalysisResult> {
	const startTime = Date.now();

	while (Date.now() - startTime < maxWaitMs) {
		const result = await getCallAnalysis(callId);

		// Check if analysis is ready
		if (result.summary || result.evaluation) {
			return result;
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}

	throw new Error(`Analysis not ready after ${maxWaitMs}ms`);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatPhoneNumber(number: string): string {
	// Ensure E.164 format
	if (!number.startsWith("+")) {
		// Assume US number if no country code
		if (number.length === 10) {
			return `+1${number}`;
		}
		return `+${number}`;
	}
	return number;
}

export function formatDuration(seconds?: number): string {
	if (!seconds) return "N/A";
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
