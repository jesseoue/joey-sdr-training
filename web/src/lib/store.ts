/**
 * In-memory store for call data
 * In production, use Redis or a database
 */

export interface CallMessage {
	role: "assistant" | "user";
	content: string;
	timestamp: number;
}

export interface StructuredData {
	overall_score: number;
	meeting_qualified: boolean;
	category_scores?: {
		opening_preparation: number;
		objection_handling: number;
		peer_discourse: number;
		business_value: number;
		professionalism: number;
	};
	overall_comment?: string;
}

export interface CallAnalysis {
	summary?: string;
	successEvaluation?: number;
	structuredData?: StructuredData;
}

export interface CallData {
	id: string;
	status: "ringing" | "in-progress" | "ended";
	customerNumber: string;
	assistantName: string;
	startedAt: number;
	endedAt?: number;
	messages: CallMessage[];
	transcript?: string;
	analysis?: CallAnalysis;
}

// In-memory store (use Redis in production)
const calls = new Map<string, CallData>();
const listeners = new Set<(event: string, data: CallData) => void>();

export function getCall(id: string): CallData | undefined {
	return calls.get(id);
}

export function getAllCalls(): CallData[] {
	return Array.from(calls.values()).sort((a, b) => b.startedAt - a.startedAt);
}

export function getActiveCalls(): CallData[] {
	return getAllCalls().filter((c) => c.status !== "ended");
}

export function updateCall(id: string, data: Partial<CallData>): CallData {
	const existing = calls.get(id) || {
		id,
		status: "ringing" as const,
		customerNumber: "Unknown",
		assistantName: "Joey",
		startedAt: Date.now(),
		messages: [],
	};

	const updated = { ...existing, ...data };
	calls.set(id, updated);

	// Notify listeners
	const eventType = data.status === "ended" ? "call-ended" : "call-updated";
	listeners.forEach((listener) => listener(eventType, updated));

	return updated;
}

export function addMessage(callId: string, message: CallMessage): void {
	const call = calls.get(callId);
	if (call) {
		call.messages.push(message);
		listeners.forEach((listener) => listener("message", call));
	}
}

export function subscribe(callback: (event: string, data: CallData) => void): () => void {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

// Cleanup old calls after 1 hour
setInterval(
	() => {
		const oneHourAgo = Date.now() - 60 * 60 * 1000;
		for (const [id, call] of calls) {
			if (call.endedAt && call.endedAt < oneHourAgo) {
				calls.delete(id);
			}
		}
	},
	5 * 60 * 1000,
);
