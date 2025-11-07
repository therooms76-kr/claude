/**
 * Toxicity and content moderation filter
 */
import type { GuardrailResult, Violation } from '../types';
import { logger } from '../utils/logger';

export class ToxicityFilter {
  // Simple toxicity keywords (in production, use a proper ML model or API)
  private toxicKeywords = [
    'hate',
    'violence',
    'offensive',
    'harassment',
    'threat',
    // Add more keywords or use a proper toxicity detection model
  ];

  private threshold: number;

  constructor(threshold = 0.7) {
    this.threshold = threshold;
  }

  /**
   * Detect toxicity in text
   * In production, integrate with a proper toxicity detection API
   * like Perspective API, OpenAI Moderation API, etc.
   */
  async detect(text: string): Promise<Violation[]> {
    const violations: Violation[] = [];

    // Simple keyword-based detection (replace with ML model in production)
    const lowerText = text.toLowerCase();
    const foundKeywords: string[] = [];

    for (const keyword of this.toxicKeywords) {
      if (lowerText.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }

    if (foundKeywords.length > 0) {
      // Calculate a simple toxicity score
      const score = Math.min(foundKeywords.length * 0.3, 1.0);

      if (score >= this.threshold) {
        violations.push({
          type: 'toxicity',
          severity: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low',
          description: `Detected potentially toxic content (score: ${score.toFixed(2)})`,
          location: `Keywords: ${foundKeywords.join(', ')}`,
        });
      }
    }

    return violations;
  }

  /**
   * Check if text is toxic
   */
  async check(text: string): Promise<GuardrailResult> {
    const violations = await this.detect(text);
    const passed = violations.length === 0;

    if (violations.length > 0) {
      logger.warn({ violations }, 'Toxic content detected');
    }

    return {
      passed,
      violations,
      filteredContent: passed ? undefined : '[CONTENT_MODERATED]',
    };
  }

  /**
   * Set toxicity threshold
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }
}

// Export singleton instance
export const toxicityFilter = new ToxicityFilter();
