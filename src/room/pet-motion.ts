import type { Point } from "../core/profile";
import { RouteMotion } from "./motion";

/** The small navigation surface shared by the indoor and outdoor pet movers. */
export interface PetMotionNavigation {
  walkable(point: Point): boolean;
  path(start: Point, end: Point): Point[];
}

export interface PetMotionActor {
  point: Point;
  path: Point[];
  wait: number;
}

export interface PetMotionAvatar {
  point: Point;
}

export interface PetMotionResult {
  facing: number;
  moved: boolean;
}

/**
 * Shared pet tuning and target selection. Keeping this policy independent of
 * rendering means every space gets the same calm speed and bounded wandering,
 * while each space can still supply its own obstacle-aware navigation.
 */
export class PetRoamingPolicy {
  readonly speed = 0.8;
  readonly maxDistance = 3.6;
  readonly minDistance = 0.8;
  readonly maxWanderDistance = 2.4;
  readonly minWait = 3;
  readonly maxWait = 7;
  readonly catchUpWait = 1.5;
  readonly callWait = 4;

  wanderTarget(
    origin: Point,
    angle: number,
    distance: number,
    navigation: PetMotionNavigation,
  ): Point {
    const boundedDistance = Math.max(
      this.minDistance,
      Math.min(this.maxWanderDistance, distance),
    );
    const candidates = [0, Math.PI / 3, -Math.PI / 3, Math.PI].map(
      (turn) => ({
        x: origin.x + Math.cos(angle + turn) * boundedDistance,
        z: origin.z + Math.sin(angle + turn) * boundedDistance,
      }),
    );
    return (
      candidates.find((candidate) => navigation.walkable(candidate)) ?? {
        ...origin,
      }
    );
  }

  /** Prefer a shoulder position so calling a pet never puts it on the avatar. */
  callTarget(
    origin: Point,
    facing: number,
    navigation: PetMotionNavigation,
  ): Point {
    const right = { x: Math.cos(facing), z: -Math.sin(facing) };
    const forward = { x: Math.sin(facing), z: Math.cos(facing) };
    const candidates = [
      { x: origin.x + right.x, z: origin.z + right.z },
      { x: origin.x - right.x, z: origin.z - right.z },
      {
        x: origin.x - forward.x * 0.85 + right.x * 0.5,
        z: origin.z - forward.z * 0.85 + right.z * 0.5,
      },
      { x: origin.x - forward.x, z: origin.z - forward.z },
    ];
    return candidates.find((candidate) => navigation.walkable(candidate)) ?? {
      ...origin,
    };
  }
}

/**
 * Drives one pet's waiting, target selection, catch-up and route motion.
 * Room furniture play can temporarily disable target selection while retaining
 * the same route speed, so gameplay-specific reservations remain intact.
 */
export class PetRoamingController {
  constructor(
    private readonly navigation: PetMotionNavigation,
    private readonly policy = new PetRoamingPolicy(),
    private readonly random: () => number = Math.random,
    private readonly callTarget: (
      origin: Point,
      facing: number,
      navigation: PetMotionNavigation,
    ) => Point = (origin, facing, navigation) =>
      this.policy.callTarget(origin, facing, navigation),
  ) {}

  update(
    actor: PetMotionActor,
    avatar: PetMotionAvatar,
    facing: number,
    dt: number,
    allowWander = true,
  ): PetMotionResult {
    if (allowWander && !actor.path.length) {
      const separation = Math.hypot(
        actor.point.x - avatar.point.x,
        actor.point.z - avatar.point.z,
      );
      if (separation > this.policy.maxDistance) {
        actor.path = this.navigation.path(
          actor.point,
          this.callTarget(avatar.point, facing, this.navigation),
        );
        actor.wait = this.policy.catchUpWait;
      } else {
        actor.wait -= dt;
        if (actor.wait <= 0) {
          const target = this.policy.wanderTarget(
            avatar.point,
            this.random() * Math.PI * 2,
            this.policy.minDistance +
              this.random() *
                (this.policy.maxWanderDistance - this.policy.minDistance),
            this.navigation,
          );
          actor.path = this.navigation.path(actor.point, target);
          actor.wait =
            this.policy.minWait +
            this.random() * (this.policy.maxWait - this.policy.minWait);
        }
      }
    }
    return RouteMotion.step(
      actor.point,
      actor.path,
      facing,
      this.policy.speed,
      dt,
    );
  }

  call(actor: PetMotionActor, avatar: PetMotionAvatar, facing: number): boolean {
    actor.path = this.navigation.path(
      actor.point,
      this.callTarget(avatar.point, facing, this.navigation),
    );
    actor.wait = this.policy.callWait;
    return actor.path.length > 0;
  }

  pause(actor: PetMotionActor, seconds: number): void {
    actor.path = [];
    actor.wait = Math.max(0, seconds);
  }
}
