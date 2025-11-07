/**
 * PII (Personally Identifiable Information) filter
 */
import type { GuardrailResult, Violation } from '../types';
import { logger } from '../utils/logger';

export class PIIFilter {
  // Common PII patterns
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    // Add more patterns as needed
  };

  /**
   * Detect PII in text
   */
  detect(text: string): Violation[] {
    const violations: Violation[] = [];

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        violations.push({
          type: 'pii',
          severity: this.getSeverity(type),
          description: `Detected ${type}: ${matches.length} occurrence(s)`,
          location: type,
        });
      }
    }

    return violations;
  }

  /**
   * Filter PII from text
   */
  filter(text: string): string {
    let filtered = text;

    for (const [type, pattern] of Object.entries(this.patterns)) {
      filtered = filtered.replace(pattern, this.getMask(type));
    }

    return filtered;
  }

  /**
   * Check if text contains PII
   */
  check(text: string): GuardrailResult {
    const violations = this.detect(text);
    const passed = violations.length === 0;

    if (violations.length > 0) {
      logger.warn({ violations }, 'PII detected in text');
    }

    return {
      passed,
      violations,
      filteredContent: passed ? undefined : this.filter(text),
    };
  }

  /**
   * Get severity based on PII type
   */
  private getSeverity(type: string): 'low' | 'medium' | 'high' {
    const highSeverity = ['ssn', 'creditCard'];
    const mediumSeverity = ['email', 'phone'];

    if (highSeverity.includes(type)) return 'high';
    if (mediumSeverity.includes(type)) return 'medium';
    return 'low';
  }

  /**
   * Get mask based on PII type
   */
  private getMask(type: string): string {
    const masks: Record<string, string> = {
      email: '[EMAIL_REDACTED]',
      phone: '[PHONE_REDACTED]',
      ssn: '[SSN_REDACTED]',
      creditCard: '[CARD_REDACTED]',
      ipAddress: '[IP_REDACTED]',
    };

    return masks[type] || '[PII_REDACTED]';
  }
}

// Export singleton instance
export const piiFilter = new PIIFilter();
