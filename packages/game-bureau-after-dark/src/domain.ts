export interface Point { x: number; y: number }
export interface Wall extends Point { w: number; h: number }
export interface Sigil { id: string; name: string; riddle: string; choices: string[]; answer: number; clue: string }
export interface SearchSpot extends Point { id: string; label: string; sigilId?: string }
export interface Reward { id: string; name: string; kind: string; description: string }
export interface Level { id: number; title: string; subtitle: string; walls: Wall[]; spots: SearchSpot[]; sigils: Sigil[]; order: string[]; reward: Reward }

export const LEVELS: Level[] = [
  {
    id: 0, title: 'The Midnight Archive', subtitle: 'Silver writing hides among the quiet shelves.',
    walls: [150, 580].flatMap(x => [150, 315, 480].map(y => ({ x, y, w: 230, h: 65 }))),
    spots: [
      { id: 'alcove', label: 'Quiet alcove', x: 95, y: 115, sigilId: 'moon' },
      { id: 'desk', label: 'Reading desk', x: 470, y: 260, sigilId: 'feather' },
      { id: 'drawer', label: 'Brass drawer', x: 850, y: 425, sigilId: 'key' },
      { id: 'tray', label: 'Sorting tray', x: 95, y: 430 },
      { id: 'niche', label: 'Wall niche', x: 850, y: 260 },
      { id: 'cabinet', label: 'Low cabinet', x: 265, y: 590 },
    ],
    sigils: [
      { id: 'moon', name: 'Moon', riddle: 'I borrow my glow and change my face. I watch the night from a distant place. What am I?', choices: ['A lantern', 'The moon', 'A mirror'], answer: 1, clue: 'Moon comes first, before Feather and Key.' },
      { id: 'feather', name: 'Feather', riddle: 'I once helped a bird travel high. Now one small breeze can make me fly. What am I?', choices: ['A feather', 'A leaf', 'A cloud'], answer: 0, clue: 'Feather follows Moon and comes before Key.' },
      { id: 'key', name: 'Key', riddle: 'I have teeth but never bite. Turn me once and a lock feels right. What am I?', choices: ['A comb', 'A zipper', 'A key'], answer: 2, clue: 'Key follows Feather and comes last.' },
    ],
    order: ['moon', 'feather', 'key'],
    reward: { id: 'night-garden', name: 'Night Garden', kind: 'Case file', description: 'An invented Bureau case file about a garden that blooms only beneath moonlight. Its silver petals leave no footprints.' },
  },
  {
    id: 1, title: 'The Cabinet of Wonders', subtitle: 'A new department holds another hidden record.',
    walls: [
      { x: 150, y: 160, w: 250, h: 65 }, { x: 555, y: 160, w: 255, h: 65 },
      { x: 220, y: 330, w: 180, h: 65 }, { x: 555, y: 330, w: 225, h: 65 },
      { x: 150, y: 485, w: 230, h: 65 }, { x: 605, y: 485, w: 205, h: 65 },
    ],
    spots: [
      { id: 'window', label: 'High window', x: 105, y: 115, sigilId: 'star' },
      { id: 'case', label: 'Glass case', x: 475, y: 275, sigilId: 'shell' },
      { id: 'stand', label: 'Display stand', x: 860, y: 430, sigilId: 'flame' },
      { id: 'bench', label: 'Stone bench', x: 105, y: 420 },
      { id: 'box', label: 'Velvet box', x: 860, y: 270 },
      { id: 'ledger', label: 'Closed ledger', x: 260, y: 590 },
    ],
    sigils: [
      { id: 'star', name: 'Star', riddle: 'Far above, I shine at night. I am a distant sun, a tiny point of light. What am I?', choices: ['A firefly', 'A star', 'A snowflake'], answer: 1, clue: 'Star comes first, before Shell and Flame.' },
      { id: 'shell', name: 'Shell', riddle: 'A sea creature made me its home. Empty now, I rest where the waves leave foam. What am I?', choices: ['A shell', 'A pebble', 'A pearl'], answer: 0, clue: 'Shell follows Star and comes before Flame.' },
      { id: 'flame', name: 'Flame', riddle: 'I dance above a candle wick. A puff of breath can end my flick. What am I?', choices: ['A ribbon', 'A shadow', 'A flame'], answer: 2, clue: 'Flame follows Shell and comes last.' },
    ],
    order: ['star', 'shell', 'flame'],
    reward: { id: 'lanternwing', name: 'Lanternwing', kind: 'Cryptid record', description: 'An invented Bureau record of a gentle mothlike cryptid whose glowing wings guide lost travelers home.' },
  },
];

interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
interface SavedProgress { version: 1; found: Record<string, string[]>; rewards: string[]; selectedLevel: number }
const SAVE_KEY = 'bureau-after-dark:progress:v2';

export class ProgressStore {
  private state: SavedProgress = { version: 1, found: { '0': [], '1': [] }, rewards: [], selectedLevel: 0 };
  private storage?: StorageLike;
  private persistent = false;

  constructor(storage?: StorageLike) {
    let raw: string | null = null;
    try {
      this.storage = storage ?? globalThis.localStorage;
      if (!this.storage) return;
      raw = this.storage.getItem(SAVE_KEY);
    } catch { this.storage = undefined; return; }
    try { if (raw) this.restore(JSON.parse(raw)); }
    catch { /* Corrupt saves reset to an empty, valid save. */ }
    this.persist();
  }

  private restore(value: unknown): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const raw = value as Record<string, unknown>;
    if (raw.version !== 1) return;
    const found = raw.found && typeof raw.found === 'object' && !Array.isArray(raw.found) ? raw.found as Record<string, unknown> : {};
    const rewards = Array.isArray(raw.rewards) ? raw.rewards : [];
    for (const level of LEVELS) {
      if (level.id > 0 && !this.completed(level.id - 1)) break;
      const items = Array.isArray(found[String(level.id)]) ? found[String(level.id)] as unknown[] : [];
      this.state.found[String(level.id)] = level.order.filter(id => items.includes(id));
      if (this.found(level.id).length === level.sigils.length && rewards.includes(level.reward.id)) this.state.rewards.push(level.reward.id);
    }
    if (typeof raw.selectedLevel === 'number' && Number.isInteger(raw.selectedLevel) && this.unlocked(raw.selectedLevel)) this.state.selectedLevel = raw.selectedLevel;
  }

  private persist(): void {
    if (!this.storage) { this.persistent = false; return; }
    try { this.storage.setItem(SAVE_KEY, JSON.stringify(this.state)); this.persistent = true; }
    catch { this.persistent = false; }
  }

  get saving(): boolean { return this.persistent; }
  get selectedLevel(): number { return this.state.selectedLevel; }
  found(level: number): string[] { return [...(this.state.found[String(level)] ?? [])]; }
  unlocked(level: number): boolean { return !!LEVELS[level] && (level === 0 || this.completed(level - 1)); }
  completed(level: number): boolean { const item = LEVELS[level]; return !!item && this.state.rewards.includes(item.reward.id); }
  discover(level: number, sigilId: string): boolean {
    const item = LEVELS[level];
    if (!item || !this.unlocked(level) || !item.order.includes(sigilId) || this.found(level).includes(sigilId)) return false;
    this.state.found[String(level)].push(sigilId); this.persist(); return true;
  }
  claim(level: number, sequence: string[]): boolean {
    const item = LEVELS[level];
    if (!item || !this.unlocked(level) || this.completed(level) || this.found(level).length !== item.sigils.length || sequence.length !== item.order.length || sequence.some((id, index) => id !== item.order[index])) return false;
    this.state.rewards.push(item.reward.id); this.persist(); return true;
  }
  rewards(): Reward[] { return LEVELS.filter(level => this.completed(level.id)).map(level => ({ ...level.reward })); }
  select(level: number): boolean {
    if (!this.unlocked(level)) return false;
    this.state.selectedLevel = level; this.persist(); return true;
  }
}

/** Small deterministic grid routes, then visibility smoothing, for touch destinations. */
export class Navigator {
  private readonly radius = 13;
  constructor(private readonly walls: Wall[]) {}

  blocked(p: Point): boolean {
    return !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 53 || p.x > 907 || p.y < 78 || p.y > 624 || this.walls.some(w => p.x >= w.x - this.radius && p.x <= w.x + w.w + this.radius && p.y >= w.y - this.radius && p.y <= w.y + w.h + this.radius);
  }

  private clear(a: Point, b: Point): boolean {
    // Exact expanded-rectangle intersections also catch a very short corner clip
    // that could fall between the samples below.
    for (const wall of this.walls) {
      let low = 0, high = 1;
      for (const [origin, delta, minimum, maximum] of [
        [a.x, b.x - a.x, wall.x - this.radius, wall.x + wall.w + this.radius],
        [a.y, b.y - a.y, wall.y - this.radius, wall.y + wall.h + this.radius],
      ]) {
        if (delta === 0) { if (origin < minimum || origin > maximum) { low = 2; break; } }
        else {
          const first = (minimum - origin) / delta, second = (maximum - origin) / delta;
          low = Math.max(low, Math.min(first, second)); high = Math.min(high, Math.max(first, second));
        }
      }
      if (low <= high) return false;
    }
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
    for (let n = 0; n <= steps; n++) if (this.blocked({ x: a.x + (b.x - a.x) * n / steps, y: a.y + (b.y - a.y) * n / steps })) return false;
    return true;
  }

  path(start: Point, target: Point): Point[] {
    if (this.blocked(start) || this.blocked(target)) return [];
    if (this.clear(start, target)) return [{ ...target }];
    const width = 86, height = 55;
    const nodes = Array.from({ length: width * height }, (_, index) => ({ x: 53 + (index % width) * 10, y: 78 + Math.floor(index / width) * 10 }));
    const usable = nodes.map(p => !this.blocked(p));
    const nearest = (p: Point): number => {
      const candidates = nodes.map((node, index) => ({ index, distance: Math.hypot(node.x - p.x, node.y - p.y) })).filter(node => usable[node.index]).sort((a, b) => a.distance - b.distance);
      return candidates.find(node => this.clear(p, nodes[node.index]))?.index ?? -1;
    };
    const first = nearest(start), last = nearest(target);
    if (first < 0 || last < 0) return [];
    const previous = new Int32Array(nodes.length).fill(-1);
    previous[first] = first;
    const queue = [first];
    for (let cursor = 0; cursor < queue.length && previous[last] < 0; cursor++) {
      const current = queue[cursor];
      for (const next of [current - width, current + width, current % width > 0 ? current - 1 : -1, current % width < width - 1 ? current + 1 : -1]) {
        if (next < 0 || next >= nodes.length || !usable[next] || previous[next] >= 0 || !this.clear(nodes[current], nodes[next])) continue;
        previous[next] = current; queue.push(next);
      }
    }
    if (previous[last] < 0) return [];
    const route: Point[] = [{ ...target }];
    for (let current = last; ; current = previous[current]) { route.push(nodes[current]); if (current === first) break; }
    route.push({ ...start }); route.reverse();
    const smoothed: Point[] = [];
    for (let index = 0; index < route.length - 1;) {
      let next = route.length - 1;
      while (next > index + 1 && !this.clear(route[index], route[next])) next--;
      smoothed.push({ ...route[next] }); index = next;
    }
    return smoothed;
  }
}
