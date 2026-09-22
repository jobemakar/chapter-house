/** Legacy bellows rotated a slightly upward vector; retain its stored angles. */
export const FAN_LEGACY_HEADING = Math.atan2(-0.2, 1);
export function fanHeading(storedAngle = 0): number { return storedAngle + FAN_LEGACY_HEADING; }
export function fanStoredAngle(heading: number): number { return heading - FAN_LEGACY_HEADING; }
