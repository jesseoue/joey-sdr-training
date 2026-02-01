"use client";

import type { ReactNode } from "react";
import { CallsProvider } from "@/lib/calls-context";
import { VapiProvider } from "@/lib/vapi-client";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<CallsProvider>
			{VAPI_PUBLIC_KEY ? (
				<VapiProvider publicKey={VAPI_PUBLIC_KEY}>{children}</VapiProvider>
			) : (
				children
			)}
		</CallsProvider>
	);
}
