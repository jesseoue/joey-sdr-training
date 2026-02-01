"use client";

import Vapi from "@vapi-ai/web";
import React, {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

interface TranscriptMessage {
	role: "assistant" | "user";
	text: string;
	timestamp: number;
}

interface VapiContextValue {
	isReady: boolean;
	isCallActive: boolean;
	isSpeaking: boolean;
	volumeLevel: number;
	transcript: TranscriptMessage[];
	error: string | null;
	startCall: (assistantId: string) => void;
	endCall: () => void;
	sendMessage: (message: string) => void;
	setMuted: (muted: boolean) => void;
	isMuted: boolean;
}

const VapiContext = createContext<VapiContextValue | null>(null);

interface VapiProviderProps {
	publicKey: string;
	children: ReactNode;
}

export function VapiProvider({ publicKey, children }: VapiProviderProps) {
	const vapiRef = useRef<Vapi | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isCallActive, setIsCallActive] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [volumeLevel, setVolumeLevel] = useState(0);
	const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isMuted, setIsMutedState] = useState(false);

	useEffect(() => {
		if (!publicKey) {
			setError("Vapi public key not configured");
			return;
		}

		const vapi = new Vapi(publicKey);
		vapiRef.current = vapi;

		const handleCallStart = () => {
			setIsCallActive(true);
			setError(null);
			setTranscript([]);
		};

		const handleCallEnd = () => {
			setIsCallActive(false);
			setIsSpeaking(false);
			setVolumeLevel(0);
		};

		const handleSpeechStart = () => {
			setIsSpeaking(true);
		};

		const handleSpeechEnd = () => {
			setIsSpeaking(false);
		};

		const handleVolumeLevel = (level: number) => {
			setVolumeLevel(level);
		};

		const handleMessage = (message: { type: string; role?: string; transcript?: string }) => {
			if (message.type === "transcript" && message.transcript) {
				setTranscript((prev) => [
					...prev,
					{
						role: (message.role as "assistant" | "user") || "user",
						text: message.transcript || "",
						timestamp: Date.now(),
					},
				]);
			}
		};

		const handleError = (err: Error) => {
			console.error("[Vapi] Error:", err);
			setError(err.message || "Unknown error");
		};

		vapi.on("call-start", handleCallStart);
		vapi.on("call-end", handleCallEnd);
		vapi.on("speech-start", handleSpeechStart);
		vapi.on("speech-end", handleSpeechEnd);
		vapi.on("volume-level", handleVolumeLevel);
		vapi.on("message", handleMessage);
		vapi.on("error", handleError);

		setIsReady(true);

		return () => {
			vapi.stop();
			vapiRef.current = null;
		};
	}, [publicKey]);

	const startCall = useCallback((assistantId: string) => {
		if (vapiRef.current) {
			setError(null);
			vapiRef.current.start(assistantId);
		}
	}, []);

	const endCall = useCallback(() => {
		if (vapiRef.current) {
			vapiRef.current.stop();
		}
	}, []);

	const sendMessage = useCallback((content: string) => {
		if (vapiRef.current && content.trim()) {
			vapiRef.current.send({
				type: "add-message",
				message: { role: "user", content },
			});
		}
	}, []);

	const setMuted = useCallback((muted: boolean) => {
		if (vapiRef.current) {
			vapiRef.current.setMuted(muted);
			setIsMutedState(muted);
		}
	}, []);

	const value = useMemo(
		() => ({
			isReady,
			isCallActive,
			isSpeaking,
			volumeLevel,
			transcript,
			error,
			startCall,
			endCall,
			sendMessage,
			setMuted,
			isMuted,
		}),
		[
			isReady,
			isCallActive,
			isSpeaking,
			volumeLevel,
			transcript,
			error,
			startCall,
			endCall,
			sendMessage,
			setMuted,
			isMuted,
		],
	);

	return React.createElement(VapiContext.Provider, { value }, children);
}

export function useVapi() {
	const context = useContext(VapiContext);
	if (!context) {
		throw new Error("useVapi must be used within a VapiProvider");
	}
	return context;
}
