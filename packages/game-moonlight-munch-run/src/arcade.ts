/* Adapted from Space Patrol, Copyright (c) 2018 Nuno Freitas, MIT.
 * Commit 63b1a09d2ff70d5504ebc060cdaa9feb4f205b8d.
 * Retained notice: assets/SPACE-PATROL-LICENSE.txt; plans/source-adaptation.md.
 */
// Original weaponNewLevel/incWeaponLevel validation, unchanged in behavior.
export function weaponNewLevel(
  level: number,
  defaultLevel: number,
  maxLevel: number,
): number {
  const newLevel = Math.floor(level);
  return newLevel >= 1 && newLevel <= maxLevel ? newLevel : defaultLevel;
}
export function incWeaponLevel(current: number, max: number): number {
  return weaponNewLevel(current + 1, current, max);
}
/** EnemyWeaponComponent's cyclic steps/timestamps, detached from Phaser. */
export class FireSteps {
  private lastFired = 0;
  private currentStep = 0;
  constructor(private readonly steps: readonly number[]) {}
  ready(time: number): boolean {
    if (time <= this.lastFired) return false;
    this.lastFired = time + this.steps[this.currentStep];
    this.currentStep += 1;
    if (this.currentStep >= this.steps.length) this.currentStep = 0;
    return true;
  }
}
/** PulseLevel4's stored-angle delegation, with narrower food patterns. */
export class ServingPattern {
  constructor(private readonly angles: readonly number[]) {}
  get count(): number {
    return this.angles.length;
  }
  angle(index: number): number {
    return this.angles[index];
  }
  static spread(level: number): ServingPattern {
    return new ServingPattern(
      level === 1
        ? [-18, 0, 18]
        : level === 2
          ? [-24, -12, 0, 12, 24]
          : [-30, -20, -10, 0, 10, 20, 30],
    );
  }
}
