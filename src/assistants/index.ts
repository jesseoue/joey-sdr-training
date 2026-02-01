/**
 * Assistant Configuration Index
 * Export all Joey personas for SDR training
 */

export { joeyElite } from "./joey-elite.js";
export { joeyOptimized } from "./joey-optimized.js";
export { joeyVpGrowth } from "./joey-vp-growth.js";

import type { AssistantConfig } from "../types/index.js";
import { joeyElite } from "./joey-elite.js";
import { joeyOptimized } from "./joey-optimized.js";
import { joeyVpGrowth } from "./joey-vp-growth.js";

// Assistant registry by key
export const ASSISTANTS: Record<string, AssistantConfig> = {
	"joey-optimized": joeyOptimized,
	"joey-vp-growth": joeyVpGrowth,
	"joey-elite": joeyElite,
};

// Assistant IDs for quick lookup
export const ASSISTANT_IDS = {
	"joey-optimized": "46dec9e9-a844-4f66-b08a-ddc44735d403",
	"joey-vp-growth": "bb3b91d8-1685-4903-a124-305420959429",
	"joey-elite": "c068d8e8-ee09-4055-95a0-5ecf0da4c6df",
} as const;

export type AssistantKey = keyof typeof ASSISTANT_IDS;

// Get assistant by key or ID
export function getAssistant(keyOrId: string): AssistantConfig | undefined {
	// Try by key first
	if (keyOrId in ASSISTANTS) {
		return ASSISTANTS[keyOrId];
	}

	// Try by ID
	for (const config of Object.values(ASSISTANTS)) {
		if (config.id === keyOrId) {
			return config;
		}
	}

	return undefined;
}

// Get all assistant configs
export function getAllAssistants(): AssistantConfig[] {
	return Object.values(ASSISTANTS);
}

// Difficulty levels
export const DIFFICULTY_LEVELS: Record<
	AssistantKey,
	"easy" | "medium" | "hard"
> = {
	"joey-optimized": "medium",
	"joey-vp-growth": "medium",
	"joey-elite": "hard",
};
