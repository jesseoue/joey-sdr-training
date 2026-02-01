"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { CallData } from "@/lib/store";

interface CallsContextValue {
	calls: CallData[];
	connected: boolean;
	activeCalls: CallData[];
	completedCalls: CallData[];
}

const CallsContext = createContext<CallsContextValue | null>(null);

export function CallsProvider({ children }: { children: ReactNode }) {
	const [calls, setCalls] = useState<CallData[]>([]);
	const [connected, setConnected] = useState(false);

	const updateCall = useCallback((newCall: CallData) => {
		setCalls((prev) => {
			const existing = prev.findIndex((c) => c.id === newCall.id);
			if (existing >= 0) {
				const updated = [...prev];
				updated[existing] = newCall;
				return updated;
			}
			return [newCall, ...prev];
		});
	}, []);

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
					updateCall(data.call);
				}
			} catch (e) {
				console.error("SSE parse error:", e);
			}
		};

		return () => eventSource.close();
	}, [updateCall]);

	const activeCalls = useMemo(() => calls.filter((c) => c.status !== "ended"), [calls]);

	const completedCalls = useMemo(
		() =>
			calls
				.filter((c) => c.status === "ended")
				.sort((a, b) => (b.endedAt || b.startedAt) - (a.endedAt || a.startedAt)),
		[calls],
	);

	const value = useMemo(
		() => ({ calls, connected, activeCalls, completedCalls }),
		[calls, connected, activeCalls, completedCalls],
	);

	return <CallsContext.Provider value={value}>{children}</CallsContext.Provider>;
}

export function useCalls(): CallsContextValue {
	const context = useContext(CallsContext);
	if (!context) {
		throw new Error("useCalls must be used within a CallsProvider");
	}
	return context;
}
