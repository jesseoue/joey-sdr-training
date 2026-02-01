"use client";

import { CheckCircle2, Clock, Phone, XCircle } from "lucide-react";
import { memo } from "react";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDuration } from "@/lib/format";
import type { CallData } from "@/lib/store";

interface CallCardProps {
	call: CallData;
}

export const CallCard = memo(function CallCard({ call }: CallCardProps) {
	const score = call.analysis?.structuredData?.overall_score || call.analysis?.successEvaluation;
	const meetingEarned = call.analysis?.structuredData?.meeting_qualified;

	const statusStyles = {
		ringing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
		"in-progress": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
		ended: "bg-muted text-muted-foreground border-border",
	};

	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
						<Phone className="size-5 text-primary" />
					</div>
					<div>
						<p className="font-semibold">{call.assistantName}</p>
						<p className="text-sm text-muted-foreground font-mono">{call.customerNumber}</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Clock className="size-4" />
						<span className="font-mono">{formatDuration(call.startedAt, call.endedAt)}</span>
					</div>
					<Badge
						variant="outline"
						className={`${statusStyles[call.status]} ${call.status === "in-progress" ? "pulse-live" : ""}`}
					>
						{call.status === "in-progress" && (
							<span className="mr-1.5 size-1.5 rounded-full bg-current animate-pulse" />
						)}
						{call.status.toUpperCase().replace("-", " ")}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{call.messages.length === 0 ? (
					<p className="text-center text-muted-foreground py-8 italic">
						Waiting for conversation...
					</p>
				) : (
					<div className="max-h-48 overflow-y-auto space-y-2">
						{call.messages.slice(-6).map((msg, i) => (
							<div
								key={`${call.id}-${msg.timestamp}-${i}`}
								className={`flex gap-2 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
							>
								<div
									className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
										msg.role === "assistant"
											? "bg-muted text-foreground"
											: "bg-primary/10 text-primary"
									}`}
								>
									{msg.content}
								</div>
							</div>
						))}
					</div>
				)}

				{call.status === "ended" && score && (
					<div className="border-t pt-4">
						<div className="flex items-center justify-between">
							<div className="space-y-2">
								<h4 className="font-semibold">Final Score</h4>
								{meetingEarned !== undefined && (
									<div className="flex items-center gap-2">
										{meetingEarned ? (
											<>
												<CheckCircle2 className="size-4 text-emerald-500" />
												<span className="text-sm font-medium text-emerald-500">
													Meeting Earned!
												</span>
											</>
										) : (
											<>
												<XCircle className="size-4 text-destructive" />
												<span className="text-sm font-medium text-destructive">
													No meeting this time
												</span>
											</>
										)}
									</div>
								)}
								{call.analysis?.structuredData?.overall_comment && (
									<p className="text-sm text-muted-foreground max-w-xs">
										{call.analysis.structuredData.overall_comment}
									</p>
								)}
							</div>
							<ScoreRing score={score} size="md" />
						</div>

						{call.analysis?.structuredData?.category_scores && (
							<div className="mt-4 grid grid-cols-5 gap-2">
								{Object.entries(call.analysis.structuredData.category_scores).map(
									([key, value]) => (
										<div key={key} className="text-center">
											<div className="text-lg font-bold">{value.toFixed(1)}</div>
											<div className="text-[10px] text-muted-foreground capitalize">
												{key.replace("_", " ")}
											</div>
										</div>
									),
								)}
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
});
