/**
 * Default configurations based on Context7 Vapi best practices
 * PREMIUM CONFIGURATION - Cost is not a concern, quality is paramount
 *
 * Model Choices:
 * - LLM: GPT-4.1 (best overall) or Claude Opus 4.5 (best reasoning)
 * - Transcriber: Deepgram Flux (built for voice agents, native turn detection)
 * - Voice: ElevenLabs Turbo v2.5 (best quality/latency balance)
 */

import type {
	AnalysisPlan,
	ChunkPlan,
	DeepgramTranscriber,
	ElevenLabsVoice,
	StartSpeakingPlan,
	StopSpeakingPlan,
} from "../types/index.js";

// ============================================================================
// PREMIUM Transcriber Configuration - Deepgram Flux
// ============================================================================

/**
 * Deepgram Flux - THE BEST for voice agents
 * - Native turn detection (knows when user finishes speaking)
 * - Nova-3 level accuracy with keyterm precision
 * - Built specifically for conversational AI
 * - Eliminates interruption problems in cold calls
 */
export const DEFAULT_TRANSCRIBER: DeepgramTranscriber = {
	provider: "deepgram",
	model: "flux-general-en", // BEST for voice agents - native turn detection
	language: "en",
	smartFormat: true,
	numerals: true,
	confidenceThreshold: 0.6,
	endpointing: 300, // Flux handles this better natively
	mipOptOut: true,
	keywords: [
		// Sales/SDR terminology - boosted with weight 2-3
		"quota:2",
		"pipeline:2",
		"meeting:3",
		"discovery:2",
		"ROI:3",
		"objection:2",
		"demo:2",
		"budget:3",
		"timeline:2",
		"implementation:2",
		"SDR:2",
		"AE:2",
		"VP:2",
		"revenue:2",
		"growth:2",
		"LeadMagic:3",
		"TitanX:3",
		"Joey:2",
		"Gilkey:2",
	],
	// Keyterms for better recognition of important phrases
	keyterm: [
		"One Meeting",
		"everyone knows the rules",
		"weekly contest",
		"top 10%",
		"8.5 out of 10",
	],
};

/**
 * Alternative: Nova-3 for multilingual or highest accuracy
 */
export const NOVA3_TRANSCRIBER: DeepgramTranscriber = {
	...DEFAULT_TRANSCRIBER,
	model: "nova-3",
};

// ============================================================================
// PREMIUM Voice Configuration - ElevenLabs Turbo v2.5
// ============================================================================

/**
 * Chunk plan optimized for natural executive speech
 * - 35 characters minimum for more complete phrases
 * - Punctuation boundaries for natural pauses
 */
export const DEFAULT_CHUNK_PLAN: ChunkPlan = {
	enabled: true,
	minCharacters: 35, // Slightly higher for more natural phrases
	// API expects array of actual punctuation characters
	punctuationBoundaries: [".", ",", "!", "?"],
	formatPlan: {
		enabled: true,
		numberToDigitsCutoff: 2025,
	},
};

/**
 * ElevenLabs Turbo v2.5 - BEST balance of quality and latency
 * - ~150ms latency (fast enough for natural conversation)
 * - Superior voice quality vs Flash
 * - Language enforcement for consistent accent
 */
export const DEFAULT_VOICE: ElevenLabsVoice = {
	provider: "11labs",
	voiceId: "qQBb9ThTUPQJGQcOcY6U", // Joey's voice
	model: "eleven_turbo_v2_5", // BEST balance - premium quality, low latency
	stability: 0.78, // Slightly higher for executive consistency
	similarityBoost: 0.88, // High voice accuracy
	style: 0.25, // Subtle style for professional tone
	useSpeakerBoost: true,
	speed: 1.0,
	optimizeStreamingLatency: 3, // Maximum optimization
	enableSsmlParsing: false, // Save latency
	cachingEnabled: true,
	chunkPlan: DEFAULT_CHUNK_PLAN,
};

/**
 * Alternative: Flash v2.5 for absolute lowest latency
 */
export const FLASH_VOICE: ElevenLabsVoice = {
	...DEFAULT_VOICE,
	model: "eleven_flash_v2_5", // ~100ms latency, slightly lower quality
	stability: 0.75,
	similarityBoost: 0.85,
};

/**
 * Alternative: Multilingual v2 for highest quality
 */
export const PREMIUM_VOICE: ElevenLabsVoice = {
	...DEFAULT_VOICE,
	model: "eleven_multilingual_v2", // Highest quality, ~200ms latency
	stability: 0.82,
	similarityBoost: 0.92,
	style: 0.3,
};

// ============================================================================
// PREMIUM Speaking Plans - Optimized for Flux + Turbo
// ============================================================================

/**
 * Start speaking plan - using Vapi's smart endpointing
 * Valid providers: "vapi", "livekit", "custom-endpointing-model"
 */
export const DEFAULT_START_SPEAKING_PLAN: StartSpeakingPlan = {
	waitSeconds: 0.2,
	smartEndpointingPlan: {
		provider: "livekit", // LiveKit recommended for English
	},
	customEndpointingRules: [
		// Quick responses for yes/no questions (type: "customer" for customer speech patterns)
		{
			type: "customer",
			regex:
				"(?i)(are you interested|do you have|can you|would you|is that|does that)",
			timeoutSeconds: 0.8,
		},
		// Longer timeout for questions requiring thought/lookup
		{
			type: "customer",
			regex:
				"(?i)(what('s| is) your|tell me about|can you explain|walk me through)",
			timeoutSeconds: 2.5,
		},
		// Quick timeout for meeting confirmations
		{
			type: "customer",
			regex: "(?i)(tuesday|thursday|2 pm|10 am|meeting|schedule)",
			timeoutSeconds: 1.2,
		},
		// Allow time for objection responses (type: "assistant" for assistant speech patterns)
		{
			type: "assistant",
			regex: "(?i)(how are you different|why should I|what makes you|prove it)",
			timeoutSeconds: 2.0,
		},
	],
};

/**
 * Alternative: Vapi's own smart endpointing
 */
export const VAPI_START_SPEAKING_PLAN: StartSpeakingPlan = {
	...DEFAULT_START_SPEAKING_PLAN,
	smartEndpointingPlan: {
		provider: "vapi",
	},
};

/**
 * Stop speaking plan - finely tuned for cold calls
 */
export const DEFAULT_STOP_SPEAKING_PLAN: StopSpeakingPlan = {
	numWords: 3, // Require 3 words before interrupting
	voiceSeconds: 0.3, // Quick voice detection
	backoffSeconds: 0.7, // Natural pause after interruption
	acknowledgementPhrases: [
		"okay",
		"yeah",
		"right",
		"uh huh",
		"mm hmm",
		"got it",
		"sure",
		"I see",
		"go on",
		"continue",
		"yes",
		"yep",
		"alright",
		"interesting",
	],
	interruptionPhrases: [
		"stop",
		"wait",
		"hold on",
		"actually",
		"no",
		"that's not",
		"let me",
		"I need to",
		"hang on",
		"one second",
		"but",
	],
};

// ============================================================================
// PREMIUM Analysis Plan for SDR Evaluation
// ============================================================================

export const DEFAULT_ANALYSIS_PLAN: AnalysisPlan = {
	minMessagesThreshold: 3,
	summaryPlan: {
		enabled: true,
		timeoutSeconds: 45, // More time for thorough analysis
		messages: [
			{
				role: "system",
				content: `You are an expert SDR coach analyzing a cold call training session with Joey Gilkey (VP of Growth).

Provide a comprehensive analysis covering:
1. **Opening Effectiveness** - How well did they hook Joey in the first 30 seconds?
2. **Preparation & Research** - Did they demonstrate knowledge of the company/industry?
3. **Objection Handling** - How professionally did they handle Joey's challenges?
4. **Peer Discourse** - Did they speak as an equal, not a subordinate?
5. **Business Value Articulation** - Did they focus on outcomes, not features?
6. **Executive Presence** - Did they maintain composure under pressure?

Cite specific quotes from the caller to justify your analysis. Be direct and specific.`,
			},
			{
				role: "user",
				content:
					"Transcript:\n\n{{transcript}}\n\nCall ended reason: {{endedReason}}",
			},
		],
	},
	structuredDataPlan: {
		enabled: true,
		timeoutSeconds: 45,
		messages: [
			{
				role: "system",
				content: `Score this SDR call using Barstool-style decimal scoring (like rating pizza - e.g., 7.3/10).

SCORING CRITERIA:
- Only top 10% (8.5+) earn a meeting
- Be specific and cite exact quotes as evidence
- Each category gets a decimal score (e.g., 7.4, not just 7)
- Evaluate ALL 7 success criteria with true/false

CATEGORY WEIGHTS:
- Opening & Preparation: 15%
- Objection Handling: 25% (most important)
- Peer Discourse: 20%
- Business Value: 25%
- Professionalism: 15%

Be tough but fair. Generic calls get 5-6. Good calls get 7-8. Only exceptional calls get 8.5+.`,
			},
			{
				role: "user",
				content:
					"Transcript:\n\n{{transcript}}\n\nCall ended reason: {{endedReason}}",
			},
		],
		schema: {
			type: "object",
			title: "SDR Call Evaluation",
			description:
				"Comprehensive SDR call analysis with Barstool-style decimal scoring",
			required: [
				"overall_score",
				"category_scores",
				"success_criteria_met",
				"meeting_qualified",
				"weekly_contest_eligible",
			],
			properties: {
				overall_score: {
					type: "number",
					minimum: 0,
					maximum: 10,
					description: "Overall decimal score (e.g., 7.3, 8.7)",
				},
				overall_comment: {
					type: "string",
					description: "One-sentence Barstool-style assessment",
				},
				category_scores: {
					type: "object",
					required: [
						"opening_preparation",
						"objection_handling",
						"peer_discourse",
						"business_value",
						"professionalism",
					],
					properties: {
						opening_preparation: { type: "number", minimum: 0, maximum: 10 },
						objection_handling: { type: "number", minimum: 0, maximum: 10 },
						peer_discourse: { type: "number", minimum: 0, maximum: 10 },
						business_value: { type: "number", minimum: 0, maximum: 10 },
						professionalism: { type: "number", minimum: 0, maximum: 10 },
					},
				},
				category_feedback: {
					type: "object",
					properties: {
						opening_preparation: { type: "string" },
						objection_handling: { type: "string" },
						peer_discourse: { type: "string" },
						business_value: { type: "string" },
						professionalism: { type: "string" },
					},
				},
				success_criteria_met: {
					type: "object",
					required: [
						"professional_opening",
						"clear_value_prop",
						"handled_objections",
						"peer_discourse_ability",
						"qualifying_questions",
						"composure_under_pressure",
						"business_acumen",
					],
					properties: {
						professional_opening: { type: "boolean" },
						clear_value_prop: { type: "boolean" },
						handled_objections: { type: "boolean" },
						peer_discourse_ability: { type: "boolean" },
						qualifying_questions: { type: "boolean" },
						composure_under_pressure: { type: "boolean" },
						business_acumen: { type: "boolean" },
					},
				},
				meeting_qualified: {
					type: "boolean",
					description: "Whether SDR qualified for meeting (8.5+ score)",
				},
				weekly_contest_eligible: {
					type: "boolean",
					description: "Whether score entered into weekly contest",
				},
				pushback_quality: {
					type: "string",
					enum: [
						"none",
						"defensive",
						"professional",
						"peer_level",
						"excellent",
					],
				},
				objections_deployed: {
					type: "array",
					items: { type: "string" },
				},
				quoted_examples: {
					type: "array",
					items: {
						type: "object",
						required: ["quote", "category"],
						properties: {
							quote: { type: "string" },
							category: {
								type: "string",
								enum: [
									"opening_preparation",
									"objection_handling",
									"peer_discourse",
									"business_value",
									"professionalism",
									"overall",
								],
							},
							improvement: { type: "string" },
						},
					},
				},
				scoring_trigger: {
					type: "string",
					enum: ["requested_by_caller", "call_ended"],
				},
				coaching_provided: {
					type: "string",
				},
			},
		},
	},
	successEvaluationPlan: {
		enabled: true,
		rubric: "NumericScale",
		timeoutSeconds: 30,
		messages: [
			{
				role: "system",
				content:
					"Evaluate this SDR's performance on a 1-10 scale. Consider preparation, objection handling, business acumen, and executive presence. Score 8.5+ indicates top 10% performance worthy of a meeting.",
			},
			{
				role: "user",
				content:
					"Transcript:\n\n{{transcript}}\n\nCall ended reason: {{endedReason}}",
			},
			{
				role: "user",
				content: "System prompt:\n\n{{systemPrompt}}",
			},
		],
	},
};

// ============================================================================
// Phone Numbers
// ============================================================================

export const PHONE_NUMBERS = {
	siptip: {
		id: "8e3e9f68-2ef3-433f-8f50-1efb37e89919",
		number: "+19122962442",
		name: "siptip",
		defaultAssistant: "joey-vp-growth",
	},
	joeyOptimized: {
		id: "7f635232-905d-4185-a9d2-4d905b323779",
		number: "+16592167227",
		name: "Joey (Optimized)",
		defaultAssistant: "joey-optimized",
	},
	joeyVpGrowth: {
		id: "aa27f637-0d91-4968-a656-80f09fc1863a",
		number: "+16173708226",
		name: "Joey - VP Growth",
		defaultAssistant: "joey-vp-growth",
	},
} as const;

export type PhoneNumberKey = keyof typeof PHONE_NUMBERS;

// ============================================================================
// Model Presets - Easy switching between configurations
// ============================================================================

export const MODEL_PRESETS = {
	// RECOMMENDED: Best overall for cold calls
	premium: {
		llm: { provider: "openai", model: "gpt-4.1" },
		transcriber: "flux-general-en",
		voice: "eleven_turbo_v2_5",
	},
	// Alternative: Claude for complex reasoning
	claudePremium: {
		llm: { provider: "anthropic", model: "claude-opus-4-5-20251101" },
		transcriber: "flux-general-en",
		voice: "eleven_turbo_v2_5",
	},
	// Lowest latency possible
	ultraFast: {
		llm: { provider: "groq", model: "llama-3.3-70b-versatile" },
		transcriber: "flux-general-en",
		voice: "eleven_flash_v2_5",
	},
	// Highest quality (slower)
	maxQuality: {
		llm: { provider: "openai", model: "gpt-4.1" },
		transcriber: "nova-3",
		voice: "eleven_multilingual_v2",
	},
} as const;
