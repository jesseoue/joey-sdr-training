/**
 * Webhook Server for Vapi Call Events
 * Handles real-time call events and analysis
 */

import { createHmac, timingSafeEqual } from "crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import type { SDRCallEvaluation } from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

export interface WebhookMessage {
	type: string;
	call?: {
		id: string;
		status: string;
		assistantId?: string;
		phoneNumberId?: string;
		customer?: {
			number: string;
		};
		monitor?: {
			listenUrl?: string;
			controlUrl?: string;
		};
	};
	transcript?: string;
	endedReason?: string;
	analysis?: {
		summary?: string;
		successEvaluation?: number;
		structuredData?: SDRCallEvaluation;
	};
	toolWithToolCallList?: Array<{
		toolCall: {
			id: string;
			function_name: string;
			arguments: string;
		};
	}>;
	// For conversation-update events
	conversation?: Array<{
		role: string;
		content: string;
	}>;
}

export type WebhookHandler = (message: WebhookMessage) => void | Promise<void>;

// ============================================================================
// Webhook Verification
// ============================================================================

function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	try {
		const expectedSignature = createHmac("sha256", secret)
			.update(payload)
			.digest("hex");

		return timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(expectedSignature),
		);
	} catch {
		return false;
	}
}

// ============================================================================
// Event Handlers
// ============================================================================

const eventHandlers: Map<string, WebhookHandler[]> = new Map();

export function onWebhookEvent(
	eventType: string,
	handler: WebhookHandler,
): void {
	const handlers = eventHandlers.get(eventType) || [];
	handlers.push(handler);
	eventHandlers.set(eventType, handlers);
}

export function onCallStarted(handler: WebhookHandler): void {
	onWebhookEvent("call-started", handler);
}

export function onCallEnded(handler: WebhookHandler): void {
	onWebhookEvent("end-of-call-report", handler);
}

export function onTranscriptUpdate(handler: WebhookHandler): void {
	onWebhookEvent("transcript", handler);
}

export function onSpeechUpdate(handler: WebhookHandler): void {
	onWebhookEvent("speech-update", handler);
}

export function onStatusUpdate(handler: WebhookHandler): void {
	onWebhookEvent("status-update", handler);
}

export function onUserInterrupted(handler: WebhookHandler): void {
	onWebhookEvent("user-interrupted", handler);
}

async function dispatchEvent(message: WebhookMessage): Promise<void> {
	const handlers = eventHandlers.get(message.type) || [];

	for (const handler of handlers) {
		try {
			await handler(message);
		} catch (error) {
			console.error(`Error in handler for ${message.type}:`, error);
		}
	}

	// Also dispatch to wildcard handlers
	const wildcardHandlers = eventHandlers.get("*") || [];
	for (const handler of wildcardHandlers) {
		try {
			await handler(message);
		} catch (error) {
			console.error(`Error in wildcard handler:`, error);
		}
	}
}

// ============================================================================
// Server
// ============================================================================

export interface WebhookServerOptions {
	port?: number;
	webhookSecret?: string;
	path?: string;
}

export function createWebhookServer(options: WebhookServerOptions = {}) {
	const {
		port = 3000,
		webhookSecret = process.env.VAPI_WEBHOOK_SECRET,
		path = "/webhook",
	} = options;

	const server = createServer(
		async (req: IncomingMessage, res: ServerResponse) => {
			// Health check
			if (req.url === "/health" && req.method === "GET") {
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
				);
				return;
			}

			// Only handle POST to webhook path
			if (req.url !== path || req.method !== "POST") {
				res.writeHead(404);
				res.end("Not Found");
				return;
			}

			// Collect body
			let body = "";
			req.on("data", (chunk) => {
				body += chunk.toString();
			});

			req.on("end", async () => {
				try {
					// Verify signature if secret is configured
					if (webhookSecret) {
						const signature = req.headers["x-vapi-signature"] as string;
						if (
							!signature ||
							!verifyWebhookSignature(body, signature, webhookSecret)
						) {
							console.warn("Invalid webhook signature");
							res.writeHead(401, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ error: "Invalid signature" }));
							return;
						}
					}

					// Parse message
					const data = JSON.parse(body);
					const message: WebhookMessage = data.message || data;

					console.log(`[Webhook] Received: ${message.type}`, {
						callId: message.call?.id,
						status: message.call?.status,
					});

					// Dispatch to handlers
					await dispatchEvent(message);

					// Respond with success
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ received: true }));
				} catch (error) {
					console.error("Webhook error:", error);
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "Internal server error" }));
				}
			});
		},
	);

	return {
		server,
		start: () => {
			return new Promise<void>((resolve) => {
				server.listen(port, () => {
					console.log(`🎤 Webhook server listening on port ${port}`);
					console.log(`   Endpoint: http://localhost:${port}${path}`);
					console.log(`   Health: http://localhost:${port}/health`);
					resolve();
				});
			});
		},
		stop: () => {
			return new Promise<void>((resolve, reject) => {
				server.close((err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		},
	};
}

// ============================================================================
// Default Event Handlers for Logging
// ============================================================================

export function setupDefaultHandlers(): void {
	onCallStarted((msg) => {
		console.log(`\n📞 Call started: ${msg.call?.id}`);
		console.log(`   Customer: ${msg.call?.customer?.number}`);
		if (msg.call?.monitor?.controlUrl) {
			console.log(`   🎧 Listen URL: ${msg.call.monitor.controlUrl.replace('/control', '/listen')}`);
		}
		console.log('');
	});

	// Real-time transcript updates
	onTranscriptUpdate((msg) => {
		if (msg.transcript) {
			// Clear line and print transcript
			process.stdout.write('\r\x1b[K'); // Clear current line
			console.log(`💬 ${msg.transcript}`);
		}
	});

	// Conversation updates (shows who said what)
	onWebhookEvent('conversation-update', (msg) => {
		if (msg.conversation && msg.conversation.length > 0) {
			const lastMsg = msg.conversation[msg.conversation.length - 1];
			if (lastMsg) {
				const role = lastMsg.role === 'assistant' ? '🤖 Joey' : '👤 Caller';
				console.log(`${role}: ${lastMsg.content}`);
			}
		}
	});

	onCallEnded((msg) => {
		console.log(`\n📴 Call ended: ${msg.call?.id}`);
		console.log(`   Reason: ${msg.endedReason}`);

		if (msg.analysis) {
			console.log(`\n📊 Analysis:`);
			console.log(`   Summary: ${msg.analysis.summary}`);
			console.log(`   Success Score: ${msg.analysis.successEvaluation}`);

			if (msg.analysis.structuredData) {
				const data = msg.analysis.structuredData;
				console.log(`\n🎯 SDR Evaluation:`);
				console.log(`   Overall Score: ${data.overall_score}/10`);
				console.log(
					`   Meeting Qualified: ${data.meeting_qualified ? "YES ✅" : "NO ❌"}`,
				);
				console.log(
					`   Weekly Contest: ${data.weekly_contest_eligible ? "YES" : "NO"}`,
				);

				if (data.category_scores) {
					console.log(`\n   Category Scores:`);
					console.log(
						`     Opening & Prep: ${data.category_scores.opening_preparation}/10`,
					);
					console.log(
						`     Objection Handling: ${data.category_scores.objection_handling}/10`,
					);
					console.log(
						`     Peer Discourse: ${data.category_scores.peer_discourse}/10`,
					);
					console.log(
						`     Business Value: ${data.category_scores.business_value}/10`,
					);
					console.log(
						`     Professionalism: ${data.category_scores.professionalism}/10`,
					);
				}
			}
		}
	});

	onUserInterrupted((msg) => {
		console.log(`🗣️ User interrupted: ${msg.call?.id}`);
	});
}
