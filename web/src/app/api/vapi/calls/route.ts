import { type NextRequest, NextResponse } from "next/server";
import { getCall, listCalls } from "@/lib/vapi-server";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const callId = searchParams.get("id");
		const assistantId = searchParams.get("assistantId");
		const limit = searchParams.get("limit");

		if (callId) {
			const call = await getCall(callId);
			return NextResponse.json(call);
		}

		const calls = await listCalls({
			assistantId: assistantId || undefined,
			limit: limit ? Number.parseInt(limit, 10) : 50,
		});

		return NextResponse.json({ calls });
	} catch (error) {
		console.error("[Calls API] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to fetch calls" },
			{ status: 500 },
		);
	}
}
