import { VapiClient } from "@vapi-ai/server-sdk";

let client: VapiClient | null = null;

export function getVapiClient(): VapiClient {
	if (!client) {
		const apiKey = process.env.VAPI_API_KEY;
		if (!apiKey) {
			throw new Error("VAPI_API_KEY environment variable is not set");
		}
		client = new VapiClient({ token: apiKey });
	}
	return client;
}

export async function listCalls(options?: {
	assistantId?: string;
	limit?: number;
	createdAfter?: Date;
}) {
	const vapi = getVapiClient();
	return vapi.calls.list({
		assistantId: options?.assistantId,
		limit: options?.limit ?? 50,
		createdAtGt: options?.createdAfter?.toISOString(),
	});
}

export async function getCall(callId: string) {
	const vapi = getVapiClient();
	return vapi.calls.get({ id: callId });
}

export async function listAssistants() {
	const vapi = getVapiClient();
	return vapi.assistants.list();
}

export async function getAssistant(assistantId: string) {
	const vapi = getVapiClient();
	return vapi.assistants.get({ id: assistantId });
}

export async function updateAssistantWebhook(assistantId: string, webhookUrl: string) {
	const vapi = getVapiClient();
	return vapi.assistants.update({
		id: assistantId,
		server: {
			url: webhookUrl,
			timeoutSeconds: 30,
		},
	});
}

export async function listPhoneNumbers() {
	const vapi = getVapiClient();
	return vapi.phoneNumbers.list();
}

export async function updatePhoneNumberWebhook(phoneNumberId: string, webhookUrl: string) {
	const vapi = getVapiClient();
	return vapi.phoneNumbers.update({
		id: phoneNumberId,
		body: {
			server: {
				url: webhookUrl,
				timeoutSeconds: 30,
			},
		},
	});
}
