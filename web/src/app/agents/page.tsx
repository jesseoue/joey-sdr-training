import { Phone, Shield, Target, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const agents = [
	{
		id: "joey-optimized",
		name: "Joey Optimized",
		title: "VP of Growth - Standard",
		phone: "+1 (659) 216-7227",
		difficulty: "Medium",
		threshold: "8.5/10",
		description:
			"Conversational and human VP persona. Busy but fair - rewards good work and genuine effort. Perfect for building confidence.",
		traits: [
			"Natural speech patterns",
			"2-3 realistic objections",
			"Acknowledges good work",
			"Fair scoring",
		],
		icon: Target,
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	{
		id: "joey-vp-growth",
		name: "Joey VP Growth",
		title: "VP of Growth - Seasoned",
		phone: "+1 (617) 370-8226",
		difficulty: "Medium-Hard",
		threshold: "8.5/10",
		description:
			"Seasoned executive with 15 years experience. Direct and efficient - every minute has a cost. Tests your business acumen.",
		traits: ["15 years experience", "Dry, sharp wit", "Tests preparation", "Direct feedback"],
		icon: Shield,
		color: "text-yellow-500",
		bgColor: "bg-yellow-500/10",
	},
	{
		id: "joey-elite",
		name: "Joey Elite",
		title: "VP of Growth - Legend",
		phone: "+1 (912) 296-2442",
		difficulty: "Hard",
		threshold: "8.5/10",
		description:
			"The boss level. He's seen 10,000 pitches and started as a cold caller in 2006. Challenges everything - but respects authenticity.",
		traits: ["Seen every trick", "BS detector active", "Quick response time", "Tighter time limit"],
		icon: Zap,
		color: "text-red-500",
		bgColor: "bg-red-500/10",
	},
];

export default function AgentsPage() {
	return (
		<div className="flex flex-1 flex-col">
			<PageHeader
				title="Training Agents"
				description="Choose your difficulty level and practice cold calling"
			/>

			<div className="flex-1 p-6">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{agents.map((agent) => (
						<Card key={agent.id} className="relative overflow-hidden">
							<div
								className={`absolute top-0 right-0 w-32 h-32 ${agent.bgColor} blur-3xl opacity-50`}
							/>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div
										className={`flex size-12 items-center justify-center rounded-xl ${agent.bgColor}`}
									>
										<agent.icon className={`size-6 ${agent.color}`} />
									</div>
									<Badge
										variant="outline"
										className={
											agent.difficulty === "Hard"
												? "border-red-500/50 text-red-500"
												: agent.difficulty === "Medium-Hard"
													? "border-yellow-500/50 text-yellow-500"
													: "border-emerald-500/50 text-emerald-500"
										}
									>
										{agent.difficulty}
									</Badge>
								</div>
								<CardTitle className="mt-4">{agent.name}</CardTitle>
								<CardDescription>{agent.title}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm text-muted-foreground">{agent.description}</p>

								<div className="space-y-2">
									<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
										Key Traits
									</p>
									<div className="flex flex-wrap gap-1.5">
										{agent.traits.map((trait) => (
											<Badge key={trait} variant="secondary" className="text-xs">
												{trait}
											</Badge>
										))}
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t">
									<div>
										<p className="text-xs text-muted-foreground">Meeting Threshold</p>
										<p className={`font-semibold ${agent.color}`}>{agent.threshold}</p>
									</div>
									<Button variant="outline" size="sm" className="gap-2">
										<Phone className="size-4" />
										{agent.phone}
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<Card className="mt-8">
					<CardHeader>
						<CardTitle>How Scoring Works</CardTitle>
						<CardDescription>All agents use the same evaluation criteria</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-5">
							{[
								{ name: "Opening & Prep", weight: "15%" },
								{ name: "Objection Handling", weight: "25%" },
								{ name: "Peer Discourse", weight: "20%" },
								{ name: "Business Value", weight: "25%" },
								{ name: "Professionalism", weight: "15%" },
							].map((category) => (
								<div key={category.name} className="text-center p-4 rounded-lg bg-muted/50">
									<p className="text-2xl font-bold">{category.weight}</p>
									<p className="text-xs text-muted-foreground mt-1">{category.name}</p>
								</div>
							))}
						</div>
						<div className="mt-6 grid gap-2 text-sm text-muted-foreground">
							<p>
								<span className="text-emerald-500 font-medium">8.5+</span> = Top 10% - Meeting
								Earned
							</p>
							<p>
								<span className="text-yellow-500 font-medium">7.0-8.4</span> = Good - Almost there
							</p>
							<p>
								<span className="text-red-500 font-medium">Below 7.0</span> = Keep practicing
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
