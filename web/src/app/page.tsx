"use client";

import { useEffect, useState } from "react";
import type { CallData } from "@/lib/store";

function formatDuration(startedAt: number, endedAt?: number): string {
	const end = endedAt || Date.now();
	const seconds = Math.floor((end - startedAt) / 1000);
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ScoreRing({ score }: { score: number }) {
	const percentage = (score / 10) * 100;
	const color = score >= 8.5 ? "#22c55e" : score >= 7 ? "#eab308" : "#ef4444";
	const circumference = 2 * Math.PI * 45;
	const offset = circumference - (percentage / 100) * circumference;

	return (
		<div className="relative w-32 h-32">
			<svg className="w-32 h-32 transform -rotate-90">
				<circle
					cx="64"
					cy="64"
					r="45"
					stroke="currentColor"
					strokeWidth="8"
					fill="none"
					className="text-white/10"
				/>
				<circle
					cx="64"
					cy="64"
					r="45"
					stroke={color}
					strokeWidth="8"
					fill="none"
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className="transition-all duration-1000"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-3xl font-bold" style={{ color }}>
					{score.toFixed(1)}
				</span>
				<span className="text-xs text-white/50">/ 10</span>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: CallData["status"] }) {
	const styles = {
		ringing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
		"in-progress": "bg-green-500/20 text-green-400 border-green-500/30 animate-pulse",
		ended: "bg-white/10 text-white/60 border-white/20",
	};

	return (
		<span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
			{status === "in-progress" && "● "}
			{status.toUpperCase().replace("-", " ")}
		</span>
	);
}

function CallCard({ call }: { call: CallData }) {
	const score = call.analysis?.structuredData?.overall_score || call.analysis?.successEvaluation;
	const meetingEarned = call.analysis?.structuredData?.meeting_qualified;

	return (
		<div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
			{/* Header */}
			<div className="p-4 border-b border-white/10 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
						<span className="text-lg">🤖</span>
					</div>
					<div>
						<h3 className="font-semibold text-white">{call.assistantName}</h3>
						<p className="text-sm text-white/50">{call.customerNumber}</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-sm text-white/50 font-mono">
						{formatDuration(call.startedAt, call.endedAt)}
					</span>
					<StatusBadge status={call.status} />
				</div>
			</div>

			{/* Messages */}
			<div className="p-4 max-h-64 overflow-y-auto space-y-3">
				{call.messages.length === 0 ? (
					<p className="text-white/30 text-center py-4 italic">Waiting for conversation...</p>
				) : (
					call.messages.slice(-6).map((msg, i) => (
						<div
							key={i}
							className={`flex gap-2 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
						>
							<div
								className={`px-3 py-2 rounded-xl max-w-[80%] ${
									msg.role === "assistant"
										? "bg-cyan-500/20 text-cyan-100"
										: "bg-amber-500/20 text-amber-100"
								}`}
							>
								<p className="text-sm">{msg.content}</p>
							</div>
						</div>
					))
				)}
			</div>

			{/* Score (if ended) */}
			{call.status === "ended" && score && (
				<div className="p-6 border-t border-white/10 bg-white/5">
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<h4 className="text-lg font-semibold text-white">Final Score</h4>
							{meetingEarned !== undefined && (
								<p
									className={`text-sm font-medium ${meetingEarned ? "text-green-400" : "text-red-400"}`}
								>
									{meetingEarned ? "✅ Meeting Earned!" : "❌ No meeting this time"}
								</p>
							)}
							{call.analysis?.structuredData?.overall_comment && (
								<p className="text-sm text-white/60 max-w-xs">
									{call.analysis.structuredData.overall_comment}
								</p>
							)}
						</div>
						<ScoreRing score={score} />
					</div>

					{/* Category Scores */}
					{call.analysis?.structuredData?.category_scores && (
						<div className="mt-4 grid grid-cols-5 gap-2">
							{Object.entries(call.analysis.structuredData.category_scores).map(([key, value]) => (
								<div key={key} className="text-center">
									<div className="text-lg font-bold text-white">{value.toFixed(1)}</div>
									<div className="text-[10px] text-white/40 capitalize">
										{key.replace("_", " ")}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default function Dashboard() {
	const [calls, setCalls] = useState<CallData[]>([]);
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const eventSource = new EventSource("/api/stream");

		eventSource.onopen = () => setConnected(true);
		eventSource.onerror = () => setConnected(false);

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === "init") {
					setCalls(data.calls);
				} else if (data.call) {
					setCalls((prev) => {
						const existing = prev.findIndex((c) => c.id === data.call.id);
						if (existing >= 0) {
							const updated = [...prev];
							updated[existing] = data.call;
							return updated;
						}
						return [data.call, ...prev];
					});
				}
			} catch (e) {
				console.error("SSE parse error:", e);
			}
		};

		return () => eventSource.close();
	}, []);

	const activeCalls = calls.filter((c) => c.status !== "ended");
	const recentCalls = calls.filter((c) => c.status === "ended").slice(0, 10);

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
			{/* Header */}
			<header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
							<span className="text-xl">🎤</span>
						</div>
						<div>
							<h1 className="text-xl font-bold text-white">Joey Dashboard</h1>
							<p className="text-xs text-white/50">SDR Cold Call Training</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<div
								className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
							/>
							<span className="text-sm text-white/50">
								{connected ? "Connected" : "Disconnected"}
							</span>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
				{/* Phone Numbers */}
				<div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
					<h2 className="text-sm font-medium text-white/60 mb-3">Call to Test</h2>
					<div className="flex flex-wrap gap-4">
						<div className="flex items-center gap-2">
							<span className="text-lg">📞</span>
							<span className="font-mono text-cyan-400">+1 (659) 216-7227</span>
							<span className="text-xs text-white/40">Joey Optimized</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-lg">📞</span>
							<span className="font-mono text-amber-400">+1 (617) 370-8226</span>
							<span className="text-xs text-white/40">Joey VP Growth</span>
						</div>
					</div>
				</div>

				{/* Active Calls */}
				{activeCalls.length > 0 && (
					<section>
						<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
							Live Calls
						</h2>
						<div className="grid gap-4">
							{activeCalls.map((call) => (
								<CallCard key={call.id} call={call} />
							))}
						</div>
					</section>
				)}

				{/* Waiting State */}
				{activeCalls.length === 0 && (
					<div className="text-center py-16">
						<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
							<span className="text-4xl">🎧</span>
						</div>
						<h2 className="text-xl font-semibold text-white mb-2">Waiting for calls...</h2>
						<p className="text-white/50 max-w-md mx-auto">
							Call one of the phone numbers above to start a training session with Joey.
						</p>
					</div>
				)}

				{/* Recent Calls */}
				{recentCalls.length > 0 && (
					<section>
						<h2 className="text-lg font-semibold text-white mb-4">Recent Calls</h2>
						<div className="grid gap-4">
							{recentCalls.map((call) => (
								<CallCard key={call.id} call={call} />
							))}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
