/**
 * Vapi Voice Bot - Type Definitions
 * Based on Context7 best practices for Vapi AI
 */

// ============================================================================
// Transcriber Types
// ============================================================================

export type DeepgramModel =
	| "flux-general-en"
	| "nova-3"
	| "nova-3-general"
	| "nova-3-medical"
	| "nova-2"
	| "nova-2-general"
	| "nova-2-meeting"
	| "nova-2-phonecall"
	| "nova-2-finance"
	| "nova-2-conversationalai"
	| "nova-2-voicemail"
	| "nova-2-video"
	| "nova-2-medical"
	| "nova-2-drivethru"
	| "nova-2-automotive"
	| "nova"
	| "nova-general"
	| "nova-phonecall"
	| "nova-medical"
	| "enhanced"
	| "enhanced-general"
	| "enhanced-meeting"
	| "enhanced-phonecall"
	| "enhanced-finance"
	| "base"
	| "base-general"
	| "base-meeting"
	| "base-phonecall"
	| "base-finance"
	| "base-conversationalai"
	| "base-voicemail"
	| "base-video"
	| "whisper";

export interface DeepgramTranscriber {
	provider: "deepgram";
	model: DeepgramModel;
	language: string;
	smartFormat?: boolean;
	numerals?: boolean;
	confidenceThreshold?: number;
	endpointing?: number;
	keywords?: string[];
	keyterm?: string[];
	mipOptOut?: boolean;
}

// ============================================================================
// Voice Types
// ============================================================================

export type ElevenLabsModel =
	| "eleven_multilingual_v2"
	| "eleven_turbo_v2"
	| "eleven_turbo_v2_5"
	| "eleven_flash_v2"
	| "eleven_flash_v2_5"
	| "eleven_monolingual_v1";

export interface ElevenLabsVoice {
	provider: "11labs";
	voiceId: string;
	model?: ElevenLabsModel;
	stability?: number;
	similarityBoost?: number;
	style?: number;
	useSpeakerBoost?: boolean;
	speed?: number;
	optimizeStreamingLatency?: number;
	enableSsmlParsing?: boolean;
	cachingEnabled?: boolean;
	chunkPlan?: ChunkPlan;
}

export interface ChunkPlan {
	enabled?: boolean;
	minCharacters?: number;
	// API expects array of punctuation characters: "。", "，", ".", "!", "?", ";", ")", "،", "۔", "।", "॥", "|", "||", ",", ":"
	punctuationBoundaries?: string[];
	formatPlan?: {
		enabled?: boolean;
		numberToDigitsCutoff?: number;
	};
}

// ============================================================================
// Speaking Plan Types
// ============================================================================

// Valid values: "vapi", "livekit", "custom-endpointing-model"
export type SmartEndpointingProvider =
	| "vapi"
	| "livekit"
	| "custom-endpointing-model";

export interface SmartEndpointingPlan {
	provider: SmartEndpointingProvider;
	waitFunction?: string;
}

export interface CustomEndpointingRule {
	// Required: "assistant", "customer", or "both"
	type: "assistant" | "customer" | "both";
	regex: string;
	regexOptions?: string[];
	timeoutSeconds: number;
}

export interface StartSpeakingPlan {
	waitSeconds?: number;
	smartEndpointingPlan?: SmartEndpointingPlan;
	customEndpointingRules?: CustomEndpointingRule[];
}

export interface StopSpeakingPlan {
	numWords?: number;
	voiceSeconds?: number;
	backoffSeconds?: number;
	acknowledgementPhrases?: string[];
	interruptionPhrases?: string[];
}

// ============================================================================
// Model Types
// ============================================================================

export interface SystemMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface ModelConfig {
	provider: "openai" | "anthropic" | "groq";
	model: string;
	messages: SystemMessage[];
	temperature?: number;
	maxTokens?: number;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface AnalysisPlanMessage {
	role: "system" | "user";
	content: string;
}

export interface SummaryPlan {
	enabled?: boolean;
	messages?: AnalysisPlanMessage[];
	timeoutSeconds?: number;
}

export interface StructuredDataPlan {
	enabled?: boolean;
	messages?: AnalysisPlanMessage[];
	schema?: Record<string, unknown>;
	timeoutSeconds?: number;
}

export interface SuccessEvaluationPlan {
	enabled?: boolean;
	rubric?:
		| "NumericScale"
		| "DescriptiveScale"
		| "Checklist"
		| "Matrix"
		| "AutomaticRubric";
	messages?: AnalysisPlanMessage[];
	timeoutSeconds?: number;
}

export interface AnalysisPlan {
	minMessagesThreshold?: number;
	summaryPlan?: SummaryPlan;
	structuredDataPlan?: StructuredDataPlan;
	successEvaluationPlan?: SuccessEvaluationPlan;
}

// ============================================================================
// Assistant Types
// ============================================================================

export interface AssistantConfig {
	id?: string;
	name: string;
	transcriber: DeepgramTranscriber;
	model: ModelConfig;
	voice: ElevenLabsVoice;
	firstMessage: string;
	firstMessageMode?: "assistant-speaks-first" | "assistant-waits-for-user";
	firstMessageInterruptionsEnabled?: boolean;
	silenceTimeoutSeconds?: number;
	maxDurationSeconds?: number;
	backgroundSound?: "office" | "off" | "cafe" | "nature";
	voicemailMessage?: string;
	endCallMessage?: string;
	startSpeakingPlan?: StartSpeakingPlan;
	stopSpeakingPlan?: StopSpeakingPlan;
	analysisPlan?: AnalysisPlan;
	artifactPlan?: {
		videoRecordingEnabled?: boolean;
		recordingEnabled?: boolean;
	};
	messagePlan?: {
		idleMessageMaxSpokenCount?: number;
		idleTimeoutSeconds?: number;
	};
}

// ============================================================================
// Phone Number Types
// ============================================================================

export interface PhoneNumber {
	id: string;
	number: string;
	name: string;
	assistantId?: string;
	status: "active" | "inactive" | "Unknown";
}

// ============================================================================
// Call Types
// ============================================================================

export interface CallCustomer {
	number: string;
	name?: string;
	numberE164CheckEnabled?: boolean;
}

export interface CreateCallParams {
	assistantId: string;
	phoneNumberId: string;
	customer: CallCustomer;
	schedulePlan?: {
		earliestAt?: string;
		latestAt?: string;
	};
}

export interface CallAnalysis {
	summary?: string;
	successEvaluation?: number;
	structuredData?: Record<string, unknown>;
}

export interface Call {
	id: string;
	status: string;
	duration?: number;
	endedReason?: string;
	createdAt: string;
	analysis?: CallAnalysis;
	transcript?: string;
	artifact?: {
		structuredOutputs?: Record<string, { result: unknown }>;
	};
}

// ============================================================================
// SDR Evaluation Types (Specific to Joey bots)
// ============================================================================

export type PushbackQuality =
	| "none"
	| "defensive"
	| "professional"
	| "peer_level"
	| "excellent";
export type ScoringTrigger = "requested_by_caller" | "call_ended";
export type FeedbackCategory =
	| "opening_preparation"
	| "objection_handling"
	| "peer_discourse"
	| "business_value"
	| "professionalism"
	| "overall";

export interface CategoryScores {
	opening_preparation: number;
	objection_handling: number;
	peer_discourse: number;
	business_value: number;
	professionalism: number;
}

export interface SuccessCriteria {
	professional_opening: boolean;
	clear_value_prop: boolean;
	handled_objections: boolean;
	peer_discourse_ability: boolean;
	qualifying_questions: boolean;
	composure_under_pressure: boolean;
	business_acumen: boolean;
}

export interface QuotedExample {
	quote: string;
	category: FeedbackCategory;
	improvement?: string;
}

export interface SDRCallEvaluation {
	overall_score: number;
	overall_comment?: string;
	category_scores: CategoryScores;
	category_feedback?: Record<keyof CategoryScores, string>;
	success_criteria_met: SuccessCriteria;
	meeting_qualified: boolean;
	weekly_contest_eligible: boolean;
	pushback_quality?: PushbackQuality;
	objections_deployed?: string[];
	quoted_examples?: QuotedExample[];
	scoring_trigger?: ScoringTrigger;
	coaching_provided?: string;
}
