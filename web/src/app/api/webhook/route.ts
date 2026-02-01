/**
 * Vapi Webhook Handler
 * Receives real-time call events from Vapi
 */

import { type NextRequest, NextResponse } from "next/server";
import { updateCall, addMessage, type CallData } from "@/lib/store";

interface VapiMessage {
	type: string;
	call?: {
		id: string;
		status: string;
		assistantId?: string;
		phoneNumberId?: string;
		customer?: {
			number: string;
		};
	};
	transcript?: string;
	endedReason?: string;
	analysis?: {
		summary?: string;
		successEvaluation?: number;
		structuredData?: {
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
		};
	};
	conversation?: Array<{
		role: string;
		content: string;
	}>;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const message: VapiMessage = body.message || body;

		console.log(`[Webhook] ${message.type}`, { callId: message.call?.id });

		const callId = message.call?.id;
		if (!callId) {
			return NextResponse.json({ received: true });
		}

		switch (message.type) {
			case "call-started":
			case "status-update":
				updateCall(callId, {
					status: message.call?.status as CallData["status"],
					customerNumber: message.call?.customer?.number || "Unknown",
					assistantName: "Joey",
				});
				break;

			case "conversation-update":
				if (message.conversation && message.conversation.length > 0) {
					const lastMsg = message.conversation[message.conversation.length - 1];
					if (lastMsg) {
						addMessage(callId, {
							role: lastMsg.role as "assistant" | "user",
							content: lastMsg.content,
							timestamp: Date.now(),
						});
					}
				}
				break;

			case "transcript":
				if (message.transcript) {
					updateCall(callId, { transcript: message.transcript });
				}
				break;

			case "end-of-call-report":
				updateCall(callId, {
					status: "ended",
					endedAt: Date.now(),
					analysis: message.analysis
						? {
								summary: message.analysis.summary,
								successEvaluation: message.analysis.successEvaluation,
								structuredData: message.analysis.structuredData,
							}
						: undefined,
				});
				break;
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("[Webhook] Error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// Health check
export async function GET() {
	return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
