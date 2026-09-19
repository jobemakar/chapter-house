export const BPM = 78;
export const SECONDS_PER_BEAT = 60 / BPM;
export const LEVEL_BEATS = 32;
export const LEVEL_NAMES = [
  "First bites", "A little sway", "Side to side", "Better together",
  "Sweet syncopation", "Moonlight bounce", "Double scoops", "Aurora party",
] as const;

export type Side = 0 | 1;
export type NoteState = "fall" | "caught" | "miss";
export interface Note {
  id: string;
  side: Side;
  x: number;
  beat: number;
  lead: number;
  radius: number;
  state: NoteState;
  flavor: number;
}
export interface RunEvent {
  type: "level" | "catch" | "miss";
  level?: number;
  note?: Note;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export function levelAt(beat: number): number {
  return 1 + Math.floor(Math.max(0, beat - 4) / LEVEL_BEATS);
}

export function levelConfig(level: number, gentle = false): {
  difficulty: number;
  lead: number;
  radius: number;
  step: number;
} {
  const difficulty = Math.min(gentle ? 2 : 8, level);
  return {
    difficulty,
    lead: 4 - Math.max(0, difficulty - 2) * 0.23,
    radius: difficulty < 3 ? 0.17 : 0.135,
    step: difficulty < 3 ? 2 : difficulty < 5 ? 1.5 : 1,
  };
}

/** The endless chart remains time-driven: accuracy never gates a new level. */
export function phrase(level: number, gentle = false): Note[] {
  const config = levelConfig(level, gentle);
  const start = 4 + (level - 1) * LEVEL_BEATS;
  const shape = [0, 0.28, -0.28, 0, -0.5, 0, 0.5, 0.28];
  const notes: Note[] = [];
  let index = 0;
  for (let offset = 0; offset < 30; offset += config.step) {
    const side: Side = index % 2 === 0 ? 0 : 1;
    const spread = config.difficulty === 1 ? 0 : config.difficulty === 2 ? 0.32 : config.difficulty === 3 ? 0.62 : 1;
    const x = 0.5 + shape[(Math.floor(index / 2) + level - 1) % shape.length]! * spread * 0.7;
    notes.push({ id: `${level}:${index}`, side, x, beat: start + offset, lead: config.lead, radius: config.radius, state: "fall", flavor: index % 3 });
    if (config.difficulty >= 4 && index % (config.difficulty < 6 ? 6 : 4) === 4) {
      notes.push({ id: `${level}:${index}b`, side: side === 0 ? 1 : 0, x: 1 - x, beat: start + offset, lead: config.lead, radius: config.radius, state: "fall", flavor: (index + 1) % 3 });
    }
    index++;
  }
  return notes;
}

export class DuetRun {
  beat = 0;
  level = 1;
  generated = 0;
  notes: Note[] = [];
  positions: [number, number] = [0.5, 0.5];
  score = 0;
  catches = 0;
  streak = 0;
  bestStreak = 0;
  misses = 0;
  gentle = false;

  advance(nextBeat: number): RunEvent[] {
    const events: RunEvent[] = [];
    this.beat = Math.max(this.beat, nextBeat);
    const nextLevel = levelAt(this.beat);
    if (nextLevel !== this.level) {
      this.level = nextLevel;
      events.push({ type: "level", level: nextLevel });
    }
    while (this.generated < levelAt(this.beat + 5)) this.notes.push(...phrase(++this.generated, this.gentle));
    for (const note of this.notes) {
      if (note.state !== "fall") continue;
      const delta = this.beat - note.beat;
      if (delta >= -0.06 && delta <= 0.24 && Math.abs(this.positions[note.side] - note.x) <= note.radius) {
        note.state = "caught";
        this.catches++;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        this.score += 10;
        events.push({ type: "catch", note });
      } else if (delta > 0.24) {
        note.state = "miss";
        this.misses++;
        this.streak = 0;
        events.push({ type: "miss", note });
      }
    }
    this.notes = this.notes.filter((note) => note.beat > this.beat - 2);
    return events;
  }
}

/** Pointer ownership is fixed on down, so fingers may cross without swapping friends. */
export class DuetHands {
  readonly pointers = new Map<number, Side>();
  constructor(private readonly run: DuetRun) {}
  down(pointerId: number, x: number): boolean {
    const side: Side = x < 0.5 ? 0 : 1;
    if ([...this.pointers.values()].includes(side)) return false;
    this.pointers.set(pointerId, side);
    this.move(pointerId, x);
    return true;
  }
  move(pointerId: number, x: number): void {
    const side = this.pointers.get(pointerId);
    if (side !== undefined) this.run.positions[side] = clamp(x * 2 - side, 0.08, 0.92);
  }
  up(pointerId: number): void { this.pointers.delete(pointerId); }
  clear(): void { this.pointers.clear(); }
}

/** Credits only a short consequence window following human input, never transport-only music. */
export class ActivePlayWindow {
  private activeUntil = -1;
  private seconds = 0;
  private lastReported = 0;
  constructor(private readonly windowSeconds = 3) {}
  activate(now: number): void { this.activeUntil = Math.max(this.activeUntil, now + this.windowSeconds); }
  advance(now: number, delta: number, accountBase: number): number | null {
    if (now > this.activeUntil) return null;
    this.seconds += Math.max(0, delta);
    const wholeSeconds = Math.floor(this.seconds);
    if (wholeSeconds <= this.lastReported) return null;
    this.lastReported = wholeSeconds;
    return accountBase + wholeSeconds;
  }
}
