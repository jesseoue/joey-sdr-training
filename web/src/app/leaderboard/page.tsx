"use client";

import { Award, Calendar, Medal, TrendingUp, Trophy } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalls } from "@/lib/calls-context";
import { formatDateTime } from "@/lib/format";

interface LeaderboardEntry {
	rank: number;
	phone: string;
	bestScore: number;
	avgScore: number;
	totalCalls: number;
	meetingsEarned: number;
	lastCall: number;
}

export default function LeaderboardPage() {
	const { completedCalls } = useCalls();

	const leaderboard = useMemo(() => {
		const callsWithScores = completedCalls.filter((c) => c.analysis?.structuredData?.overall_score);

		const byPhone: Record<string, { scores: number[]; meetings: number; lastCall: number }> = {};

		for (const call of callsWithScores) {
			const phone = call.customerNumber;
			const score = call.analysis?.structuredData?.overall_score || 0;
			const meetingEarned = call.analysis?.structuredData?.meeting_qualified;
			const callTime = call.endedAt || call.startedAt;

			const entry = byPhone[phone];
			if (!entry) {
				byPhone[phone] = {
					scores: [score],
					meetings: meetingEarned ? 1 : 0,
					lastCall: callTime,
				};
			} else {
				entry.scores.push(score);
				if (meetingEarned) entry.meetings++;
				entry.lastCall = Math.max(entry.lastCall, callTime);
			}
		}

		const entries: LeaderboardEntry[] = Object.entries(byPhone).map(([phone, data]) => {
			const totalScore = data.scores.reduce((a, b) => a + b, 0);
			return {
				rank: 0,
				phone,
				bestScore: Math.max(...data.scores),
				avgScore: totalScore / data.scores.length,
				totalCalls: data.scores.length,
				meetingsEarned: data.meetings,
				lastCall: data.lastCall,
			};
		});

		entries.sort((a, b) => b.bestScore - a.bestScore);
		entries.forEach((entry, index) => {
			entry.rank = index + 1;
		});

		return entries;
	}, [completedCalls]);

	const topScore = leaderboard[0]?.bestScore || 0;
	const totalMeetings = useMemo(
		() => leaderboard.reduce((sum, e) => sum + e.meetingsEarned, 0),
		[leaderboard],
	);

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Leaderboard" description="Weekly contest rankings" />

			<div className="flex-1 p-6 space-y-6">
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">Top Score</CardTitle>
							<Trophy className="size-4 text-yellow-500" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{topScore > 0 ? topScore.toFixed(1) : "-"}</div>
							<p className="text-xs text-muted-foreground">This week</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Meetings Earned
							</CardTitle>
							<TrendingUp className="size-4 text-emerald-500" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{totalMeetings}</div>
							<p className="text-xs text-muted-foreground">8.5+ scores</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Participants
							</CardTitle>
							<Calendar className="size-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold">{leaderboard.length}</div>
							<p className="text-xs text-muted-foreground">Unique callers</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Weekly Rankings</CardTitle>
						<CardDescription>
							Top performers ranked by best score. 8.5+ earns a meeting.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{leaderboard.length === 0 ? (
							<div className="text-center py-12">
								<Trophy className="size-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground">No completed calls yet.</p>
								<p className="text-sm text-muted-foreground">
									Make a call to appear on the leaderboard!
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{leaderboard.map((entry) => (
									<LeaderboardRow key={entry.phone} entry={entry} />
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
	return (
		<div
			className={`flex items-center gap-4 p-4 rounded-lg ${entry.rank <= 3 ? "bg-muted/50" : ""}`}
		>
			<div className="flex size-10 items-center justify-center">
				<RankIcon rank={entry.rank} />
			</div>

			<div className="flex-1 min-w-0">
				<p className="font-mono font-medium truncate">{entry.phone}</p>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>{entry.totalCalls} calls</span>
					<span>Avg: {entry.avgScore.toFixed(1)}</span>
					<span>{formatDateTime(entry.lastCall)}</span>
				</div>
			</div>

			<div className="flex items-center gap-4">
				{entry.meetingsEarned > 0 && (
					<Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
						{entry.meetingsEarned} meeting{entry.meetingsEarned > 1 ? "s" : ""}
					</Badge>
				)}
				<ScoreRing score={entry.bestScore} size="sm" showLabel={false} />
			</div>
		</div>
	);
}

function RankIcon({ rank }: { rank: number }) {
	if (rank === 1) return <Trophy className="size-5 text-yellow-500" />;
	if (rank === 2) return <Medal className="size-5 text-gray-400" />;
	if (rank === 3) return <Award className="size-5 text-amber-600" />;
	return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
}
