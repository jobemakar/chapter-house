export type SteeringVector = { x: number; y: number };

/**
 * Turn the distance from the centre of a thumb pad into a normalized flight
 * direction.  Keeping this independent of the DOM makes the pad consistent
 * across phone and tablet sizes (and straightforward to verify).
 */
export function thumbVector(
  deltaX: number,
  deltaY: number,
  radius: number,
  deadZone = 8,
): SteeringVector {
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= deadZone || radius <= deadZone) return { x: 0, y: 0 };
  const strength = Math.min(1, (distance - deadZone) / (radius - deadZone));
  return {
    x: (deltaX / distance) * strength,
    y: (deltaY / distance) * strength,
  };
}

/** Keep the visible thumb inside the ring even when a finger travels farther. */
export function thumbOffset(vector: SteeringVector, travel: number): SteeringVector {
  return { x: vector.x * travel, y: vector.y * travel };
}
