"use client";

import {
	Check,
	CheckCircle2,
	Copy,
	ExternalLink,
	Globe,
	Loader2,
	RefreshCw,
	Terminal,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigStatus {
	assistants: Array<{ id: string; name?: string; webhookUrl?: string }>;
	phoneNumbers: Array<{ id: string; number?: string; webhookUrl?: string }>;
}

interface ConfigResult {
	success: boolean;
	message: string;
	webhookUrl: string;
	results: Array<{
		type: "assistant" | "phone";
		id: string;
		name?: string;
		number?: string;
		success: boolean;
		error?: string;
	}>;
}

export default function SettingsPage() {
	const [copied, setCopied] = useState<string | null>(null);
	const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
	const [configuring, setConfiguring] = useState(false);
	const [configResult, setConfigResult] = useState<ConfigResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const copyToClipboard = (text: string, id: string) => {
		navigator.clipboard.writeText(text);
		setCopied(id);
		setTimeout(() => setCopied(null), 2000);
	};

	const fetchConfig = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await fetch("/api/vapi/configure");
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to fetch config");
			}
			const data = await res.json();
			setConfigStatus(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch config");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchConfig();
	}, [fetchConfig]);

	const autoConfigureWebhooks = async () => {
		try {
			setConfiguring(true);
			setConfigResult(null);
			setError(null);

			const webhookUrl = `${window.location.origin}/api/webhook`;

			const res = await fetch("/api/vapi/configure", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ webhookUrl }),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Configuration failed");
			}

			setConfigResult(data);
			await fetchConfig();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Configuration failed");
		} finally {
			setConfiguring(false);
		}
	};

	const currentWebhookUrl =
		typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : "";
	const allConfigured =
		configStatus?.assistants.every((a) => a.webhookUrl === currentWebhookUrl) &&
		configStatus?.phoneNumbers.every((p) => p.webhookUrl === currentWebhookUrl);

	return (
		<div className="flex flex-1 flex-col">
			<PageHeader title="Settings" description="Configure your SalesTraining environment" />

			<div className="flex-1 p-6 space-y-6 max-w-4xl">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Globe className="size-5 text-primary" />
								<CardTitle>Webhook Configuration</CardTitle>
							</div>
							{allConfigured && (
								<Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
									<CheckCircle2 className="size-3 mr-1" />
									Configured
								</Badge>
							)}
						</div>
						<CardDescription>Auto-configure Vapi webhooks to receive call events</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{error && (
							<div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
								{error}
							</div>
						)}

						<div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm">
							<Terminal className="size-4 text-muted-foreground shrink-0" />
							<code className="flex-1 truncate">{currentWebhookUrl || "Loading..."}</code>
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								onClick={() => copyToClipboard(currentWebhookUrl, "webhook")}
								disabled={!currentWebhookUrl}
							>
								{copied === "webhook" ? (
									<Check className="size-4 text-emerald-500" />
								) : (
									<Copy className="size-4" />
								)}
							</Button>
						</div>

						<div className="flex gap-2">
							<Button onClick={autoConfigureWebhooks} disabled={configuring} className="gap-2">
								{configuring ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<RefreshCw className="size-4" />
								)}
								{configuring ? "Configuring..." : "Auto-Configure All"}
							</Button>
							<Button variant="outline" onClick={fetchConfig} disabled={loading}>
								Refresh Status
							</Button>
						</div>

						{configResult && (
							<div
								className={`p-3 rounded-lg text-sm ${configResult.success ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"}`}
							>
								{configResult.message}
							</div>
						)}

						{loading ? (
							<div className="py-8 text-center text-muted-foreground">
								<Loader2 className="size-6 animate-spin mx-auto mb-2" />
								Loading configuration...
							</div>
						) : (
							configStatus && (
								<div className="space-y-4">
									<div>
										<p className="text-sm font-medium mb-2">Assistants</p>
										<div className="space-y-2">
											{configStatus.assistants.map((assistant) => (
												<div
													key={assistant.id}
													className="flex items-center justify-between p-2 rounded bg-muted/50"
												>
													<span className="text-sm">{assistant.name || assistant.id}</span>
													{assistant.webhookUrl === currentWebhookUrl ? (
														<Badge
															variant="outline"
															className="border-emerald-500/50 text-emerald-500"
														>
															<CheckCircle2 className="size-3 mr-1" />
															OK
														</Badge>
													) : assistant.webhookUrl ? (
														<Badge
															variant="outline"
															className="border-yellow-500/50 text-yellow-500"
														>
															Different URL
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="border-destructive/50 text-destructive"
														>
															<XCircle className="size-3 mr-1" />
															Not Set
														</Badge>
													)}
												</div>
											))}
											{configStatus.assistants.length === 0 && (
												<p className="text-sm text-muted-foreground">No assistants found</p>
											)}
										</div>
									</div>

									<div>
										<p className="text-sm font-medium mb-2">Phone Numbers</p>
										<div className="space-y-2">
											{configStatus.phoneNumbers.map((phone) => (
												<div
													key={phone.id}
													className="flex items-center justify-between p-2 rounded bg-muted/50"
												>
													<span className="text-sm font-mono">{phone.number || phone.id}</span>
													{phone.webhookUrl === currentWebhookUrl ? (
														<Badge
															variant="outline"
															className="border-emerald-500/50 text-emerald-500"
														>
															<CheckCircle2 className="size-3 mr-1" />
															OK
														</Badge>
													) : phone.webhookUrl ? (
														<Badge
															variant="outline"
															className="border-yellow-500/50 text-yellow-500"
														>
															Different URL
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="border-destructive/50 text-destructive"
														>
															<XCircle className="size-3 mr-1" />
															Not Set
														</Badge>
													)}
												</div>
											))}
											{configStatus.phoneNumbers.length === 0 && (
												<p className="text-sm text-muted-foreground">No phone numbers found</p>
											)}
										</div>
									</div>
								</div>
							)
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Environment Variables</CardTitle>
						<CardDescription>Required environment variables for the application</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted">
								<div className="flex items-center gap-3">
									<Badge variant="outline">Required</Badge>
									<code className="font-mono">VAPI_API_KEY</code>
								</div>
								<span className="text-sm text-muted-foreground">Server-side API key</span>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted">
								<div className="flex items-center gap-3">
									<Badge variant="secondary">Optional</Badge>
									<code className="font-mono">NEXT_PUBLIC_VAPI_PUBLIC_KEY</code>
								</div>
								<span className="text-sm text-muted-foreground">Browser calling</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Commands</CardTitle>
						<CardDescription>Useful commands for development</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3">
							{[
								{ label: "Start dev server", cmd: "cd web && bun dev" },
								{ label: "Sync agents to Vapi", cmd: "bun run vapi:sync joey-optimized" },
								{ label: "List phone numbers", cmd: "bun run vapi:phones" },
								{ label: "View recent calls", cmd: "bun run vapi:calls" },
							].map((item) => (
								<div
									key={item.cmd}
									className="flex items-center justify-between p-3 rounded-lg bg-muted"
								>
									<div>
										<p className="text-sm font-medium">{item.label}</p>
										<code className="text-xs text-muted-foreground font-mono">{item.cmd}</code>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={() => copyToClipboard(item.cmd, item.cmd)}
									>
										{copied === item.cmd ? (
											<Check className="size-4 text-emerald-500" />
										) : (
											<Copy className="size-4" />
										)}
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>External Links</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex gap-3">
							<Button variant="outline" asChild>
								<a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer">
									<ExternalLink className="size-4 mr-2" />
									Vapi Dashboard
								</a>
							</Button>
							<Button variant="outline" asChild>
								<a href="https://docs.vapi.ai" target="_blank" rel="noopener noreferrer">
									<ExternalLink className="size-4 mr-2" />
									Vapi Docs
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
