#!/usr/bin/env node

/**
 * Vapi Cold Call Testing Bot - CLI
 * Comprehensive command-line interface for managing SDR training calls
 */

import {
	ASSISTANT_IDS,
	ASSISTANTS,
	type AssistantKey,
} from "./assistants/index.js";
import { PHONE_NUMBERS, type PhoneNumberKey } from "./config/defaults.js";
import {
	createCall,
	formatDuration,
	formatPhoneNumber,
	getAssistantDetails,
	getCallAnalysis,
	getCallDetails,
	listAssistants,
	listCalls,
	listPhoneNumbers,
	updateAssistant,
	waitForCallAnalysis,
} from "./lib/vapi-client.js";
import {
	createWebhookServer,
	setupDefaultHandlers,
} from "./lib/webhook-server.js";

// ============================================================================
// CLI Helpers
// ============================================================================

const COLORS = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

function color(text: string, colorCode: string): string {
	return `${colorCode}${text}${COLORS.reset}`;
}

function printHeader(title: string): void {
	console.log(`\n${color(title, COLORS.bright + COLORS.cyan)}`);
	console.log("─".repeat(60));
}

function printSuccess(message: string): void {
	console.log(color(`✅ ${message}`, COLORS.green));
}

function printError(message: string): void {
	console.log(color(`❌ ${message}`, COLORS.red));
}

function printInfo(label: string, value: string): void {
	console.log(`  ${color(label + ":", COLORS.dim)} ${value}`);
}

// ============================================================================
// Commands
// ============================================================================

async function cmdListAssistants(): Promise<void> {
	printHeader("📋 Assistants");

	const assistants = await listAssistants();
	console.log(`Found ${assistants.length} assistant(s):\n`);

	// Group by Joey personas vs others
	const joeyIds = Object.values(ASSISTANT_IDS) as string[];
	const joeyAssistants = assistants.filter((a) => joeyIds.includes(a.id));
	const otherAssistants = assistants.filter((a) => !joeyIds.includes(a.id));

	if (joeyAssistants.length > 0) {
		console.log(color("🎯 Joey Personas (Cold Call Training):", COLORS.bright));
		for (const a of joeyAssistants) {
			const key = Object.entries(ASSISTANT_IDS).find(
				([_, id]) => id === a.id,
			)?.[0];
			console.log(`\n  • ${color(a.name, COLORS.cyan)}`);
			printInfo("    ID", a.id);
			printInfo("    Key", key || "unknown");
			printInfo("    Created", a.createdAt.toLocaleDateString());
		}
	}

	if (otherAssistants.length > 0) {
		console.log(color("\n📁 Other Assistants:", COLORS.dim));
		for (const a of otherAssistants) {
			console.log(`\n  • ${a.name}`);
			printInfo("    ID", a.id);
			printInfo("    Created", a.createdAt.toLocaleDateString());
		}
	}
}

async function cmdGetAssistant(id: string): Promise<void> {
	printHeader(`🔍 Assistant Details: ${id}`);

	const assistant = await getAssistantDetails(id);
	console.log(JSON.stringify(assistant, null, 2));
}

async function cmdListPhoneNumbers(): Promise<void> {
	printHeader("📞 Phone Numbers");

	const phones = await listPhoneNumbers();
	console.log(`Found ${phones.length} phone number(s):\n`);

	for (const p of phones) {
		const knownPhone = Object.entries(PHONE_NUMBERS).find(
			([_, phone]) => phone.id === p.id,
		);
		const status =
			p.status === "active"
				? color("active", COLORS.green)
				: color(p.status, COLORS.yellow);

		console.log(`  • ${color(p.number, COLORS.cyan)} (${p.name || "unnamed"})`);
		printInfo("    ID", p.id);
		printInfo("    Status", status);
		if (knownPhone) {
			printInfo("    Key", knownPhone[0]);
			printInfo("    Default Assistant", knownPhone[1].defaultAssistant);
		}
		if (p.assistantId) {
			printInfo("    Assigned Assistant", p.assistantId);
		}
		console.log("");
	}
}

async function cmdMakeCall(
	customerNumber: string,
	assistantKey?: string,
	phoneKey?: string,
): Promise<void> {
	printHeader("📞 Making Test Call");

	const formattedNumber = formatPhoneNumber(customerNumber);
	const assistant = (assistantKey as AssistantKey) || "joey-optimized";
	const phone = (phoneKey as PhoneNumberKey) || "joeyOptimized";

	console.log(`  Customer: ${color(formattedNumber, COLORS.cyan)}`);
	console.log(
		`  Assistant: ${color(assistant, COLORS.green)} (${ASSISTANT_IDS[assistant]})`,
	);
	console.log(`  From: ${color(PHONE_NUMBERS[phone].number, COLORS.yellow)}`);
	console.log("");

	const call = await createCall({
		customerNumber: formattedNumber,
		assistantKey: assistant,
		phoneKey: phone,
	});

	printSuccess("Call initiated!");
	printInfo("Call ID", call.id);
	printInfo("Status", call.status);
}

async function cmdListCalls(limit?: string): Promise<void> {
	printHeader("📋 Recent Calls");

	const calls = await listCalls(limit ? parseInt(limit) : 10);
	console.log(`Found ${calls.length} recent call(s):\n`);

	for (const c of calls) {
		const statusColor = c.status === "ended" ? COLORS.dim : COLORS.green;
		console.log(`  • ${color(c.id, COLORS.cyan)}`);
		printInfo("    Status", color(c.status, statusColor));
		printInfo("    Duration", formatDuration(c.duration));
		printInfo("    Ended", c.endedReason || "N/A");
		printInfo("    Created", new Date(c.createdAt).toLocaleString());
		console.log("");
	}
}

async function cmdCallDetails(callId: string): Promise<void> {
	printHeader(`🔍 Call Details: ${callId}`);

	const call = await getCallDetails(callId);

	console.log(`\n${color("Call Info:", COLORS.bright)}`);
	printInfo("Status", call.status);
	printInfo("Duration", formatDuration(call.duration));
	printInfo("Ended Reason", call.endedReason || "N/A");

	if (call.analysis) {
		console.log(`\n${color("Analysis:", COLORS.bright)}`);
		if (call.analysis.summary) {
			console.log(`\n  ${color("Summary:", COLORS.cyan)}`);
			console.log(`  ${call.analysis.summary}`);
		}
		if (call.analysis.successEvaluation !== undefined) {
			printInfo("\n  Success Score", `${call.analysis.successEvaluation}/10`);
		}
	}

	if (call.transcript) {
		console.log(`\n${color("Transcript:", COLORS.bright)}`);
		console.log(call.transcript);
	}
}

async function cmdCallAnalysis(callId: string, wait?: string): Promise<void> {
	printHeader(`📊 Call Analysis: ${callId}`);

	let analysis;
	if (wait === "--wait") {
		console.log("Waiting for analysis to be ready...");
		analysis = await waitForCallAnalysis(callId);
	} else {
		analysis = await getCallAnalysis(callId);
	}

	if (analysis.summary) {
		console.log(`\n${color("Summary:", COLORS.bright)}`);
		console.log(analysis.summary);
	}

	if (analysis.successScore !== undefined) {
		console.log(
			`\n${color("Success Score:", COLORS.bright)} ${analysis.successScore}/10`,
		);
	}

	if (analysis.evaluation) {
		const e = analysis.evaluation;
		console.log(`\n${color("🎯 SDR Evaluation:", COLORS.bright)}`);

		const scoreColor =
			e.overall_score >= 8.5
				? COLORS.green
				: e.overall_score >= 7
					? COLORS.yellow
					: COLORS.red;
		console.log(
			`\n  Overall Score: ${color(e.overall_score.toFixed(1) + "/10", scoreColor)}`,
		);

		if (e.overall_comment) {
			console.log(`  ${e.overall_comment}`);
		}

		console.log(
			`\n  Meeting Qualified: ${e.meeting_qualified ? color("YES ✅", COLORS.green) : color("NO ❌", COLORS.red)}`,
		);
		console.log(
			`  Weekly Contest: ${e.weekly_contest_eligible ? "YES" : "NO"}`,
		);

		if (e.category_scores) {
			console.log(`\n  ${color("Category Scores:", COLORS.cyan)}`);
			const cs = e.category_scores;
			console.log(
				`    Opening & Prep:     ${cs.opening_preparation.toFixed(1)}/10`,
			);
			console.log(
				`    Objection Handling: ${cs.objection_handling.toFixed(1)}/10`,
			);
			console.log(`    Peer Discourse:     ${cs.peer_discourse.toFixed(1)}/10`);
			console.log(`    Business Value:     ${cs.business_value.toFixed(1)}/10`);
			console.log(
				`    Professionalism:    ${cs.professionalism.toFixed(1)}/10`,
			);
		}

		if (e.pushback_quality) {
			console.log(`\n  Pushback Quality: ${e.pushback_quality}`);
		}

		if (e.objections_deployed && e.objections_deployed.length > 0) {
			console.log(`\n  ${color("Objections Deployed:", COLORS.cyan)}`);
			for (const obj of e.objections_deployed) {
				console.log(`    • ${obj}`);
			}
		}

		if (e.quoted_examples && e.quoted_examples.length > 0) {
			console.log(`\n  ${color("Quoted Examples:", COLORS.cyan)}`);
			for (const ex of e.quoted_examples) {
				console.log(`    [${ex.category}] "${ex.quote}"`);
				if (ex.improvement) {
					console.log(`      → ${ex.improvement}`);
				}
			}
		}

		if (e.coaching_provided) {
			console.log(`\n  ${color("Coaching:", COLORS.cyan)}`);
			console.log(`    ${e.coaching_provided}`);
		}
	}
}

async function cmdSyncAssistant(key: string): Promise<void> {
	printHeader(`🔄 Syncing Assistant: ${key}`);

	const config = ASSISTANTS[key];
	if (!config) {
		printError(`Unknown assistant key: ${key}`);
		console.log(`\nAvailable keys: ${Object.keys(ASSISTANTS).join(", ")}`);
		return;
	}

	if (!config.id) {
		printError("Assistant config has no ID");
		return;
	}

	console.log(`Updating ${config.name} (${config.id})...`);

	// Remove id before update - build clean config for API
	const { id, ...fullConfig } = config;

	// Build a clean update payload with only API-supported fields
	const updateConfig = {
		name: fullConfig.name,
		transcriber: fullConfig.transcriber
			? {
					provider: fullConfig.transcriber.provider,
					model: fullConfig.transcriber.model,
					language: fullConfig.transcriber.language,
					smartFormat: fullConfig.transcriber.smartFormat,
					numerals: fullConfig.transcriber.numerals,
					confidenceThreshold: fullConfig.transcriber.confidenceThreshold,
					endpointing: fullConfig.transcriber.endpointing,
					mipOptOut: fullConfig.transcriber.mipOptOut,
					keywords: fullConfig.transcriber.keywords,
					keyterm: fullConfig.transcriber.keyterm,
				}
			: undefined,
		model: fullConfig.model,
		voice: fullConfig.voice,
		firstMessage: fullConfig.firstMessage,
		firstMessageMode: fullConfig.firstMessageMode,
		firstMessageInterruptionsEnabled:
			fullConfig.firstMessageInterruptionsEnabled,
		silenceTimeoutSeconds: fullConfig.silenceTimeoutSeconds,
		maxDurationSeconds: fullConfig.maxDurationSeconds,
		backgroundSound: fullConfig.backgroundSound,
		voicemailMessage: fullConfig.voicemailMessage,
		endCallMessage: fullConfig.endCallMessage,
		startSpeakingPlan: fullConfig.startSpeakingPlan,
		stopSpeakingPlan: fullConfig.stopSpeakingPlan,
		analysisPlan: fullConfig.analysisPlan,
		artifactPlan: fullConfig.artifactPlan,
		messagePlan: fullConfig.messagePlan,
	};

	// Debug: log what we're sending
	if (process.env.DEBUG) {
		console.log("\n[DEBUG] Sending payload:");
		console.log(JSON.stringify(updateConfig, null, 2));
	}

	await updateAssistant(config.id, updateConfig);

	printSuccess(`Assistant ${key} synced successfully!`);
}

async function cmdWebhookServer(port?: string): Promise<void> {
	const serverPort = port ? parseInt(port) : 3000;

	printHeader(`🌐 Starting Webhook Server`);

	console.log(`
${color("To receive real-time transcripts:", COLORS.bright)}

1. Expose this server using ngrok:
   ${color("ngrok http " + serverPort, COLORS.cyan)}

2. Copy the ngrok URL and add it to Vapi Dashboard:
   ${color("https://dashboard.vapi.ai → Settings → Webhooks", COLORS.cyan)}
   Set URL to: ${color("<ngrok-url>/webhook", COLORS.green)}

3. Make a call to any Joey phone number:
   ${color("+1 (659) 216-7227", COLORS.green)} - Joey Optimized
   ${color("+1 (617) 370-8226", COLORS.green)} - Joey VP Growth

4. Watch the transcript appear below!
`);

	setupDefaultHandlers();

	const { start } = createWebhookServer({ port: serverPort });
	await start();

	console.log(`\n${color("Waiting for calls...", COLORS.dim)}`);
	console.log(`${color("Press Ctrl+C to stop", COLORS.dim)}\n`);
}

function cmdShowConfig(key: string): void {
	printHeader(`⚙️ Assistant Config: ${key}`);

	const config = ASSISTANTS[key];
	if (!config) {
		printError(`Unknown assistant key: ${key}`);
		console.log(`\nAvailable keys: ${Object.keys(ASSISTANTS).join(", ")}`);
		return;
	}

	console.log(JSON.stringify(config, null, 2));
}

function printHelp(): void {
	console.log(`
${color("🎤 Vapi Cold Call Testing Bot", COLORS.bright + COLORS.cyan)}
${color("SDR Training with Joey Gilkey Personas", COLORS.dim)}

${color("USAGE:", COLORS.bright)}
  npm run vapi <command> [options]

${color("COMMANDS:", COLORS.bright)}
  ${color("Assistants:", COLORS.cyan)}
    list                          List all assistants
    get <id>                      Get assistant details
    config <key>                  Show local config for assistant
    sync <key>                    Sync local config to Vapi

  ${color("Phone Numbers:", COLORS.cyan)}
    phones                        List all phone numbers

  ${color("Calls:", COLORS.cyan)}
    call <number> [assistant] [phone]   Make a test call
    calls [limit]                       List recent calls
    details <call-id>                   Get call details
    analysis <call-id> [--wait]         Get call analysis

  ${color("Server:", COLORS.cyan)}
    webhook [port]                Start webhook server

${color("ASSISTANT KEYS:", COLORS.bright)}
  ${color("joey-optimized", COLORS.green)}   Standard difficulty (Medium)
  ${color("joey-vp-growth", COLORS.yellow)}   VP Growth persona (Medium-Hard)
  ${color("joey-elite", COLORS.red)}       Elite difficulty (Hard)

${color("PHONE KEYS:", COLORS.bright)}
  siptip          +19122962442 → joey-vp-growth
  joeyOptimized   +16592167227 → joey-optimized
  joeyVpGrowth    +16173708226 → joey-vp-growth

${color("EXAMPLES:", COLORS.bright)}
  npm run vapi list
  npm run vapi call +15551234567
  npm run vapi call +15551234567 joey-elite siptip
  npm run vapi analysis abc123 --wait
  npm run vapi sync joey-optimized
  npm run vapi webhook 3001
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
	const [command, ...args] = process.argv.slice(2);

	try {
		switch (command) {
			case "list":
				await cmdListAssistants();
				break;

			case "get":
				if (!args[0]) {
					printError("Usage: npm run vapi get <assistant-id>");
					process.exit(1);
				}
				await cmdGetAssistant(args[0]);
				break;

			case "phones":
				await cmdListPhoneNumbers();
				break;

			case "call":
				if (!args[0]) {
					printError(
						"Usage: npm run vapi call <phone-number> [assistant-key] [phone-key]",
					);
					process.exit(1);
				}
				await cmdMakeCall(args[0], args[1], args[2]);
				break;

			case "calls":
				await cmdListCalls(args[0]);
				break;

			case "details":
				if (!args[0]) {
					printError("Usage: npm run vapi details <call-id>");
					process.exit(1);
				}
				await cmdCallDetails(args[0]);
				break;

			case "analysis":
				if (!args[0]) {
					printError("Usage: npm run vapi analysis <call-id> [--wait]");
					process.exit(1);
				}
				await cmdCallAnalysis(args[0], args[1]);
				break;

			case "config":
				if (!args[0]) {
					printError("Usage: npm run vapi config <assistant-key>");
					process.exit(1);
				}
				cmdShowConfig(args[0]);
				break;

			case "sync":
				if (!args[0]) {
					printError("Usage: npm run vapi sync <assistant-key>");
					process.exit(1);
				}
				await cmdSyncAssistant(args[0]);
				break;

			case "webhook":
				await cmdWebhookServer(args[0]);
				break;

			case "help":
			case "--help":
			case "-h":
			case undefined:
				printHelp();
				break;

			default:
				printError(`Unknown command: ${command}`);
				printHelp();
				process.exit(1);
		}
	} catch (error) {
		if (error instanceof Error) {
			printError(error.message);
		} else {
			printError(String(error));
		}
		process.exit(1);
	}
}

main();
