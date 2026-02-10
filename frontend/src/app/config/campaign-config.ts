/**
 * Campaign Planner Configuration
 * 
 * ASSUMPTIONS / FRONTEND DEFAULTS:
 * - CPM values are industry averages for US market (2024)
 * - Frequency represents average times a user sees an ad before conversion
 * - Engagement weights represent relative engagement potential (1-10 scale)
 * 
 * These values can be overridden per-channel in Advanced Options.
 */

export interface ChannelConfig {
  id: string;
  label: string;
  emoji: string;
  description: string;
  defaultCPM: number;          // Cost per 1000 impressions (USD)
  defaultFrequency: number;    // Average views per unique user
  engagementWeight: number;    // 1-10 scale, higher = better engagement
  color: string;
  gradient: string;
}

export const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    id: 'video',
    label: 'Video Ads',
    emoji: '🎬',
    description: 'YouTube, Streaming, Online TV',
    defaultCPM: 12.50,           // Video typically has higher CPM
    defaultFrequency: 3.5,       // Users need fewer video views
    engagementWeight: 9,         // High engagement potential
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
  },
  {
    id: 'display',
    label: 'Display Ads',
    emoji: '🖼️',
    description: 'Websites, Portals, Apps',
    defaultCPM: 3.50,            // Display is cheapest
    defaultFrequency: 6.0,       // Needs more frequency
    engagementWeight: 4,         // Lower engagement
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)',
  },
  {
    id: 'social',
    label: 'Social Ads',
    emoji: '📱',
    description: 'Facebook, Instagram, TikTok',
    defaultCPM: 8.00,            // Mid-range CPM
    defaultFrequency: 4.5,       // Moderate frequency
    engagementWeight: 7,         // Good engagement
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
  },
];

/**
 * Default constraints
 */
export const DEFAULT_CONSTRAINTS = {
  minPerChannel: 10,     // Global default min %
  maxPerChannel: 60,     // Global default max %
  minBudget: 100,        // Minimum total budget
  maxDays: 365,          // Maximum campaign duration
};

/**
 * Threshold values for warnings/insights
 */
export const WARNING_THRESHOLDS = {
  highConcentration: 70,         // Warn if any channel > 70%
  lowVideoForEngagement: 15,     // Warn if goal=engagement and video < 15%
  lowDailySpend: 20,             // Warn if budget/days < $20
  constrainedAllocation: 2,      // Tolerance % for "constrained" warning
};

/**
 * Goal weight configurations
 * Each goal affects how we score channels
 */
export const GOAL_WEIGHTS = {
  reach: {
    cpmWeight: 1.0,        // Prioritize low CPM
    engagementWeight: 0.0, // Ignore engagement
  },
  engagement: {
    cpmWeight: 0.3,        // Some CPM consideration
    engagementWeight: 0.7, // Prioritize engagement
  },
  balanced: {
    cpmWeight: 0.6,
    engagementWeight: 0.4,
  },
};

/**
 * Helper to get channel config by ID
 */
export function getChannelById(id: string): ChannelConfig | undefined {
  return CHANNEL_CONFIGS.find(c => c.id === id);
}

/**
 * Helper to get all channel IDs
 */
export function getAllChannelIds(): string[] {
  return CHANNEL_CONFIGS.map(c => c.id);
}


