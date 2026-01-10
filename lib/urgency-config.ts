export const URGENCY_CONSTANTS = {
  // Priority modeled as normalized values multiplied by a single coefficient
  // Normalized values chosen to mirror Taskwarrior contributions exactly:
  // H: 1.0 * 6.0 = 6.0, M: 0.65 * 6.0 = 3.9, L: 0.3 * 6.0 = 1.8, NONE: 0
  priority: {
    coefficient: 6.0,
    normalized: {
      HIGH: 1.0,
      MEDIUM: 0.65,
      LOW: 0.3,
      NONE: 0.0,
    } as const,
  },

  // Due date proximity: day-difference only.
  // For due in d >= 0 days: proximity = exponential scaling starting 7 days before
  // For overdue by o > 0 days: proximity = clamp(o/overdueSaturationDays, 0..1)
  due: {
    coefficient: 12.0,
    nearWindowDays: 4,
    overdueSaturationDays: 7,
  },

  // Age factor: normalized by horizon days, then scaled by coefficient
  age: {
    coefficient: 2.0,
    horizonDays: 30,
  },

  // Tags: special tag impacts
  tags: {
    special: {
      next: 15,
      blocked: -5,
    } as const,
  },

  // Urgency color thresholds tuned for the new scale (max roughly ~20)
  colors: {
    highThreshold: 14, // red
    mediumThreshold: 7, // orange
  },
} as const;

export type UrgencyConstants = typeof URGENCY_CONSTANTS;
