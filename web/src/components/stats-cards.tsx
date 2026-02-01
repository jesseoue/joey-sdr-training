"use client";

import { Clock, Phone, TrendingUp, Trophy } from "lucide-react";
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CallData } from "@/lib/store";

interface StatsCardsProps {
	calls: CallData[];
}

function formatAvgDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const StatsCards = memo(function StatsCards({ calls }: StatsCardsProps) {
	const { activeCount, completedCount, scores, meetingsEarned, totalDuration } = useMemo(() => {
		let activeCount = 0;
		let completedCount = 0;
		let meetingsEarned = 0;
		let totalDuration = 0;
		const scores: number[] = [];

		for (const call of calls) {
			if (call.status === "ended") {
				completedCount++;
				const score =
					call.analysis?.structuredData?.overall_score || call.analysis?.successEvaluation;
				if (score !== undefined) {
					scores.push(score);
				}
				if (call.analysis?.structuredData?.meeting_qualified) {
					meetingsEarned++;
				}
				if (call.endedAt) {
					totalDuration += (call.endedAt - call.startedAt) / 1000;
				}
			} else {
				activeCount++;
			}
		}

		return { activeCount, completedCount, scores, meetingsEarned, totalDuration };
	}, [calls]);

	const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
	const avgDuration = completedCount > 0 ? totalDuration / completedCount : 0;

	const stats = [
		{
			title: "Total Calls",
			value: calls.length.toString(),
			description: `${activeCount} active`,
			icon: Phone,
		},
		{
			title: "Avg Score",
			value: avgScore > 0 ? avgScore.toFixed(1) : "-",
			description: `${scores.length} scored`,
			icon: TrendingUp,
		},
		{
			title: "Meetings Earned",
			value: meetingsEarned.toString(),
			description: `${completedCount > 0 ? Math.round((meetingsEarned / completedCount) * 100) : 0}% success rate`,
			icon: Trophy,
		},
		{
			title: "Avg Duration",
			value: formatAvgDuration(avgDuration),
			description: `${completedCount} completed`,
			icon: Clock,
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<Card key={stat.title}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{stat.title}
						</CardTitle>
						<stat.icon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stat.value}</div>
						<p className="text-xs text-muted-foreground">{stat.description}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
});
