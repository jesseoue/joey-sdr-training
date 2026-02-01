"use client";

import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVapi } from "@/lib/vapi-client";

interface VoiceCallProps {
	assistantId: string;
	assistantName: string;
	difficulty?: string;
}

export const VoiceCall = memo(function VoiceCall({
	assistantId,
	assistantName,
	difficulty,
}: VoiceCallProps) {
	const {
		isReady,
		isCallActive,
		isSpeaking,
		volumeLevel,
		transcript,
		error,
		startCall,
		endCall,
		setMuted,
		isMuted,
	} = useVapi();
	const [callDuration, setCallDuration] = useState(0);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isCallActive) {
			setCallDuration(0);
			interval = setInterval(() => {
				setCallDuration((d) => d + 1);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isCallActive]);

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (!isReady) {
		return (
			<Card className="border-dashed">
				<CardContent className="py-8 text-center text-muted-foreground">
					Initializing voice...
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="border-destructive">
				<CardContent className="py-8 text-center text-destructive">{error}</CardContent>
			</Card>
		);
	}

	return (
		<Card className={isCallActive ? "border-emerald-500/50" : ""}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base flex items-center gap-2">
						<Phone className="size-4" />
						{assistantName}
						{difficulty && <span className="text-xs text-muted-foreground">({difficulty})</span>}
					</CardTitle>
					{isCallActive && (
						<div className="flex items-center gap-2 text-sm">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="font-mono">{formatDuration(callDuration)}</span>
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{isCallActive ? (
					<>
						<div className="flex items-center justify-center gap-2 py-4">
							<Volume2
								className={`size-5 ${isSpeaking ? "text-emerald-500" : "text-muted-foreground"}`}
							/>
							<div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full bg-emerald-500 transition-all duration-100"
									style={{ width: `${volumeLevel * 100}%` }}
								/>
							</div>
						</div>

						{transcript.length > 0 && (
							<div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg bg-muted/30">
								{transcript.slice(-6).map((msg, i) => (
									<div
										key={`${msg.timestamp}-${i}`}
										className={`flex gap-2 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}
									>
										<div
											className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
												msg.role === "assistant"
													? "bg-muted text-foreground"
													: "bg-primary/10 text-primary"
											}`}
										>
											{msg.text}
										</div>
									</div>
								))}
							</div>
						)}

						<div className="flex items-center justify-center gap-3">
							<Button
								variant="outline"
								size="icon"
								onClick={() => setMuted(!isMuted)}
								className={isMuted ? "border-destructive text-destructive" : ""}
							>
								{isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
							</Button>
							<Button variant="destructive" size="lg" onClick={endCall} className="gap-2">
								<PhoneOff className="size-4" />
								End Call
							</Button>
						</div>
					</>
				) : (
					<div className="flex flex-col items-center gap-4 py-4">
						<p className="text-sm text-muted-foreground text-center">
							Click to start a voice conversation with {assistantName}
						</p>
						<Button size="lg" onClick={() => startCall(assistantId)} className="gap-2">
							<Phone className="size-4" />
							Start Call
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
});
