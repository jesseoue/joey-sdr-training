"use client";

import { CheckCircle2, ChevronDown, Clock, Phone, XCircle } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalls } from "@/lib/calls-context";
import { formatDuration, formatFullDate } from "@/lib/format";
import type { CallData } from "@/lib/store";

export default function HistoryPage() {
	const { completedCalls } = useCalls();
	const [expandedCall, setExpandedCall] = useState<string | null>(null);

	const toggleExpanded = useCallback((callId: string) => {
		setExpandedCall((prev) => (prev === callId ? null : callId));
	}, []);

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Call History" description={`${completedCalls.length} completed calls`} />

			<div className="flex-1 p-6 space-y-4">
				{completedCalls.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<Clock className="size-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No call history yet.</p>
							<p className="text-sm text-muted-foreground">Completed calls will appear here.</p>
						</CardContent>
					</Card>
				) : (
					completedCalls.map((call) => (
						<HistoryCard
							key={call.id}
							call={call}
							isExpanded={expandedCall === call.id}
							onToggle={toggleExpanded}
						/>
					))
				)}
			</div>
		</div>
	);
}

interface HistoryCardProps {
	call: CallData;
	isExpanded: boolean;
	onToggle: (id: string) => void;
}

const HistoryCard = memo(function HistoryCard({ call, isExpanded, onToggle }: HistoryCardProps) {
	const score = call.analysis?.structuredData?.overall_score || call.analysis?.successEvaluation;
	const meetingEarned = call.analysis?.structuredData?.meeting_qualified;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
							<Phone className="size-5 text-muted-foreground" />
						</div>
						<div>
							<CardTitle className="text-base">{call.assistantName}</CardTitle>
							<p className="text-sm text-muted-foreground font-mono">{call.customerNumber}</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="text-right">
							<p className="text-sm font-medium">
								{formatFullDate(call.endedAt || call.startedAt)}
							</p>
							<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<Clock className="size-3" />
								<span>{formatDuration(call.startedAt, call.endedAt)}</span>
							</div>
						</div>

						{score && <ScoreRing score={score} size="sm" showLabel={false} />}

						{meetingEarned !== undefined && (
							<Badge
								variant="outline"
								className={
									meetingEarned
										? "border-emerald-500/50 text-emerald-500"
										: "border-destructive/50 text-destructive"
								}
							>
								{meetingEarned ? (
									<>
										<CheckCircle2 className="size-3 mr-1" />
										Meeting
									</>
								) : (
									<>
										<XCircle className="size-3 mr-1" />
										No Meeting
									</>
								)}
							</Badge>
						)}

						<Button variant="ghost" size="icon" onClick={() => onToggle(call.id)}>
							<ChevronDown
								className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
							/>
						</Button>
					</div>
				</div>
			</CardHeader>

			{isExpanded && (
				<CardContent className="border-t pt-4 space-y-4">
					{call.analysis?.structuredData?.overall_comment && (
						<div>
							<p className="text-sm font-medium mb-1">Summary</p>
							<p className="text-sm text-muted-foreground">
								{call.analysis.structuredData.overall_comment}
							</p>
						</div>
					)}

					{call.analysis?.structuredData?.category_scores && (
						<div>
							<p className="text-sm font-medium mb-3">Category Scores</p>
							<div className="grid grid-cols-5 gap-4">
								{Object.entries(call.analysis.structuredData.category_scores).map(
									([key, value]) => (
										<div key={key} className="text-center p-3 rounded-lg bg-muted/50">
											<p className="text-xl font-bold">{value.toFixed(1)}</p>
											<p className="text-[10px] text-muted-foreground capitalize">
												{key.replace("_", " ")}
											</p>
										</div>
									),
								)}
							</div>
						</div>
					)}

					{call.messages.length > 0 && (
						<div>
							<p className="text-sm font-medium mb-3">Transcript</p>
							<div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg bg-muted/30">
								{call.messages.map((msg, i) => (
									<div
										key={`${call.id}-msg-${i}`}
										className={`flex gap-2 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
									>
										<div
											className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${
												msg.role === "assistant" ? "bg-muted" : "bg-primary/10 text-primary"
											}`}
										>
											<span className="text-xs text-muted-foreground block mb-0.5">
												{msg.role === "assistant" ? "Joey" : "You"}
											</span>
											{msg.content}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			)}
		</Card>
	);
});
