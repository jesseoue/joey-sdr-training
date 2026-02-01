/**
 * Server-Sent Events for real-time call updates
 */

import { type CallData, getAllCalls, subscribe } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			// Send initial state
			const calls = getAllCalls();
			const initialData = `data: ${JSON.stringify({ type: "init", calls })}\n\n`;
			controller.enqueue(encoder.encode(initialData));

			// Subscribe to updates
			const unsubscribe = subscribe((event: string, data: CallData) => {
				try {
					const sseData = `data: ${JSON.stringify({ type: event, call: data })}\n\n`;
					controller.enqueue(encoder.encode(sseData));
				} catch {
					// Stream closed
				}
			});

			// Heartbeat every 30s to keep connection alive
			const heartbeat = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(": heartbeat\n\n"));
				} catch {
					clearInterval(heartbeat);
				}
			}, 30000);

			// Cleanup on close
			return () => {
				unsubscribe();
				clearInterval(heartbeat);
			};
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
}
