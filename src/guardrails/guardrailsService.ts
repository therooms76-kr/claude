/**
 * Guardrails service for content safety and compliance
 */
import type { GuardrailResult, Violation } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { piiFilter } from './piiFilter';
import { toxicityFilter } from './toxicityFilter';

export class GuardrailsService {
  /**
   * Apply all enabled guardrails to text
   */
  async apply(text: string): Promise<GuardrailResult> {
    const violations: Violation[] = [];
    let filteredContent = text;

    // PII filtering
    if (config.guardrails.enablePIIFilter) {
      const piiResult = piiFilter.check(text);
      violations.push(...piiResult.violations);

      if (!piiResult.passed && piiResult.filteredContent) {
        filteredContent = piiResult.filteredContent;
      }
    }

    // Toxicity filtering
    if (config.guardrails.enableToxicityFilter) {
      toxicityFilter.setThreshold(config.guardrails.toxicityThreshold);
      const toxicityResult = await toxicityFilter.check(text);
      violations.push(...toxicityResult.violations);

      if (!toxicityResult.passed && toxicityResult.filteredContent) {
        filteredContent = toxicityResult.filteredContent;
      }
    }

    const passed = violations.length === 0;

    if (!passed) {
      logger.warn(
        {
          violations: violations.length,
          details: violations,
        },
        'Guardrails detected violations'
      );
    }

    return {
      passed,
      violations,
      filteredContent: passed ? undefined : filteredContent,
    };
  }

  /**
   * Apply guardrails to multiple messages
   */
  async applyToMessages(messages: Array<{ role: string; content: string }>): Promise<{
    passed: boolean;
    violations: Violation[];
    filteredMessages?: Array<{ role: string; content: string }>;
  }> {
    const allViolations: Violation[] = [];
    const filteredMessages = [];
    let anyFailed = false;

    for (const message of messages) {
      const result = await this.apply(message.content);
      allViolations.push(...result.violations);

      if (!result.passed) {
        anyFailed = true;
        filteredMessages.push({
          role: message.role,
          content: result.filteredContent || message.content,
        });
      } else {
        filteredMessages.push(message);
      }
    }

    return {
      passed: !anyFailed,
      violations: allViolations,
      filteredMessages: anyFailed ? filteredMessages : undefined,
    };
  }

  /**
   * Check if content should be blocked
   */
  shouldBlock(violations: Violation[]): boolean {
    // Block if any high-severity violations
    return violations.some((v) => v.severity === 'high');
  }
}

// Export singleton instance
export const guardrailsService = new GuardrailsService();
