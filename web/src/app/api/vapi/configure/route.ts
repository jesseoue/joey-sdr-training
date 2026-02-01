import { type NextRequest, NextResponse } from "next/server";
import {
	listAssistants,
	listPhoneNumbers,
	updateAssistantWebhook,
	updatePhoneNumberWebhook,
} from "@/lib/vapi-server";

interface ConfigureRequest {
	webhookUrl: string;
}

interface ConfigResult {
	type: "assistant" | "phone";
	id: string;
	name?: string;
	number?: string;
	success: boolean;
	error?: string;
}

export async function POST(request: NextRequest) {
	try {
		const { webhookUrl } = (await request.json()) as ConfigureRequest;

		if (!webhookUrl) {
			return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
		}

		const results: ConfigResult[] = [];

		const [assistants, phoneNumbers] = await Promise.all([listAssistants(), listPhoneNumbers()]);

		for (const assistant of assistants) {
			try {
				await updateAssistantWebhook(assistant.id, webhookUrl);
				results.push({
					type: "assistant",
					id: assistant.id,
					name: assistant.name ?? undefined,
					success: true,
				});
			} catch (err) {
				results.push({
					type: "assistant",
					id: assistant.id,
					name: assistant.name ?? undefined,
					success: false,
					error: err instanceof Error ? err.message : "Unknown error",
				});
			}
		}

		for (const phone of phoneNumbers) {
			try {
				await updatePhoneNumberWebhook(phone.id, webhookUrl);
				results.push({
					type: "phone",
					id: phone.id,
					number: "number" in phone ? (phone.number as string) : undefined,
					success: true,
				});
			} catch (err) {
				results.push({
					type: "phone",
					id: phone.id,
					number: "number" in phone ? (phone.number as string) : undefined,
					success: false,
					error: err instanceof Error ? err.message : "Unknown error",
				});
			}
		}

		const successCount = results.filter((r) => r.success).length;
		const failCount = results.filter((r) => !r.success).length;

		return NextResponse.json({
			success: failCount === 0,
			message: `Configured ${successCount} resources${failCount > 0 ? `, ${failCount} failed` : ""}`,
			webhookUrl,
			results,
		});
	} catch (error) {
		console.error("[Configure] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Configuration failed" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const [assistants, phoneNumbers] = await Promise.all([listAssistants(), listPhoneNumbers()]);

		return NextResponse.json({
			assistants: assistants.map((a) => ({
				id: a.id,
				name: a.name,
				webhookUrl: a.server?.url,
			})),
			phoneNumbers: phoneNumbers.map((p) => ({
				id: p.id,
				number: "number" in p ? p.number : undefined,
				webhookUrl: "server" in p ? (p.server as { url?: string })?.url : undefined,
			})),
		});
	} catch (error) {
		console.error("[Configure] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to fetch config" },
			{ status: 500 },
		);
	}
}
