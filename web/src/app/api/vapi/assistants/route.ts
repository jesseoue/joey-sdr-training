import { NextResponse } from "next/server";
import { listAssistants } from "@/lib/vapi-server";

export async function GET() {
	try {
		const assistants = await listAssistants();

		return NextResponse.json({
			assistants: assistants.map((a) => ({
				id: a.id,
				name: a.name,
				model: a.model,
				createdAt: a.createdAt,
			})),
		});
	} catch (error) {
		console.error("[Assistants API] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to fetch assistants" },
			{ status: 500 },
		);
	}
}
