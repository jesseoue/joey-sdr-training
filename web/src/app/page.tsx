"use client";

import { Headphones, Mic, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { CallCard } from "@/components/call-card";
import { PageHeader } from "@/components/page-header";
import { StatsCards } from "@/components/stats-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceCall } from "@/components/voice-call";
import { useCalls } from "@/lib/calls-context";

const AGENTS = [
	{
		id: "joey-optimized",
		assistantId: "46dec9e9-a844-4f66-b08a-ddc44735d403",
		name: "Joey Optimized",
		phone: "+1 (659) 216-7227",
		difficulty: "Medium",
	},
	{
		id: "joey-vp-growth",
		assistantId: "bb3b91d8-1685-4903-a124-305420959429",
		name: "Joey VP Growth",
		phone: "+1 (617) 370-8226",
		difficulty: "Medium-Hard",
	},
	{
		id: "joey-elite",
		assistantId: "c068d8e8-ee09-4055-95a0-5ecf0da4c6df",
		name: "Joey Elite",
		phone: "+1 (912) 296-2442",
		difficulty: "Hard",
	},
];

export default function Dashboard() {
	const { calls, connected, activeCalls } = useCalls();
	const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
	const hasVapiKey = Boolean(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

	const recentCalls = useMemo(() => {
		return calls
			.filter((c) => c.status === "ended")
			.sort((a, b) => (b.endedAt || b.startedAt) - (a.endedAt || a.startedAt))
			.slice(0, 10);
	}, [calls]);

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Dashboard" description="Real-time call monitoring">
				<Badge
					variant="outline"
					className={
						connected
							? "border-emerald-500/50 text-emerald-500"
							: "border-destructive/50 text-destructive"
					}
				>
					<span
						className={`mr-1.5 size-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`}
					/>
					{connected ? "Connected" : "Disconnected"}
				</Badge>
			</PageHeader>

			<div className="flex-1 space-y-6 p-6">
				<StatsCards calls={calls} />

				<Tabs defaultValue={hasVapiKey ? "browser" : "phone"} className="w-full">
					<TabsList className="grid w-full grid-cols-2 max-w-md">
						<TabsTrigger value="browser" className="gap-2" disabled={!hasVapiKey}>
							<Mic className="size-4" />
							Browser Call
						</TabsTrigger>
						<TabsTrigger value="phone" className="gap-2">
							<Phone className="size-4" />
							Phone Call
						</TabsTrigger>
					</TabsList>

					<TabsContent value="browser" className="mt-4">
						{hasVapiKey ? (
							<div className="grid gap-4 lg:grid-cols-2">
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-base">Select Agent</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex flex-col gap-2">
											{AGENTS.map((agent) => (
												<Button
													key={agent.id}
													variant={selectedAgent.id === agent.id ? "default" : "outline"}
													className="justify-between"
													onClick={() => setSelectedAgent(agent)}
												>
													<span>{agent.name}</span>
													<Badge
														variant="secondary"
														className={
															agent.difficulty === "Hard"
																? "bg-red-500/10 text-red-500"
																: agent.difficulty === "Medium-Hard"
																	? "bg-yellow-500/10 text-yellow-500"
																	: "bg-emerald-500/10 text-emerald-500"
														}
													>
														{agent.difficulty}
													</Badge>
												</Button>
											))}
										</div>
									</CardContent>
								</Card>

								<VoiceCall
									assistantId={selectedAgent.assistantId}
									assistantName={selectedAgent.name}
									difficulty={selectedAgent.difficulty}
								/>
							</div>
						) : (
							<Card className="border-dashed">
								<CardContent className="py-8 text-center text-muted-foreground">
									<p>Browser calling requires NEXT_PUBLIC_VAPI_PUBLIC_KEY</p>
									<p className="text-sm mt-2">
										Use phone calling or configure the environment variable
									</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="phone" className="mt-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<Phone className="size-4" />
									Quick Dial Numbers
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-4">
									{AGENTS.map((agent) => (
										<QuickDialItem
											key={agent.id}
											name={agent.name}
											phone={agent.phone}
											difficulty={agent.difficulty}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{activeCalls.length > 0 && (
					<section className="space-y-4">
						<div className="flex items-center gap-2">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<h2 className="text-lg font-semibold">Live Calls</h2>
						</div>
						<div className="grid gap-4">
							{activeCalls.map((call) => (
								<CallCard key={call.id} call={call} />
							))}
						</div>
					</section>
				)}

				{activeCalls.length === 0 && (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center justify-center py-16">
							<div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
								<Headphones className="size-8 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold mb-2">Waiting for calls...</h3>
							<p className="text-muted-foreground text-center max-w-md">
								Start a browser call above or dial one of the phone numbers to begin training.
							</p>
						</CardContent>
					</Card>
				)}

				{recentCalls.length > 0 && (
					<section className="space-y-4">
						<h2 className="text-lg font-semibold">Recent Calls</h2>
						<div className="grid gap-4">
							{recentCalls.map((call) => (
								<CallCard key={call.id} call={call} />
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}

const difficultyColors: Record<string, string> = {
	Medium: "text-emerald-500",
	"Medium-Hard": "text-yellow-500",
	Hard: "text-destructive",
};

function QuickDialItem({
	name,
	phone,
	difficulty,
}: {
	name: string;
	phone: string;
	difficulty: string;
}) {
	const difficultyColor = difficultyColors[difficulty] || "text-muted-foreground";

	return (
		<div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
			<Phone className="size-4 text-muted-foreground" />
			<div>
				<p className="font-medium font-mono">{phone}</p>
				<p className="text-xs text-muted-foreground">
					{name} <span className={difficultyColor}>({difficulty})</span>
				</p>
			</div>
		</div>
	);
}
