import type { RoomDefinition, Viewport } from "./types";
import { CampaignCatalog, RoomValidator } from "./catalog";
import { ORIGINAL_ROOM_BRIEFS } from "./original-room-briefs";

export const GAME_VIEWPORT: Viewport = Object.freeze({ width: 560, height: 800 });

const PROTOTYPE_SOURCE = Object.freeze({ kind: "keyfall-prototype" as const });
const MLGROPE_COMMIT = "1c398f18dfb5977fb1f7fcb8a671584a102f406a" as const;
const mlgropeSource = (path: "levels/0.csv" | "levels/1.csv") => Object.freeze({
  kind: "mlgrope-mit-adaptation" as const,
  repository: "https://github.com/emersion/mlgrope" as const,
  commit: MLGROPE_COMMIT,
  path,
  license: "MIT" as const,
});

const ORIGINAL_SOURCE = Object.freeze({ kind: "original" as const });
const brief = (roomNumber: number) => {
  const value = ORIGINAL_ROOM_BRIEFS.find((candidate) => candidate.roomNumber === roomNumber);
  if (!value) throw new Error(`Missing clean-room brief for campaign room ${roomNumber}`);
  return value;
};
const bubble = (number: number, x: number, y: number) => ({ id: `room-${number}-bubble`, kind: "bubble" as const, position: { x, y }, captureRadius: 40, buoyancy: 0.003, popRadius: 60 });
const TICKET_OFFSETS = [
  [[4, -42], [15, -101], [21, -159]], [[13, -51], [6, -112], [25, -171]], [[-2, -47], [18, -96], [11, -166]],
  [[10, -55], [23, -109], [15, -153]], [[17, -44], [9, -116], [28, -163]], [[1, -58], [20, -103], [13, -176]],
  [[14, -49], [3, -94], [24, -157]], [[6, -53], [21, -114], [9, -169]], [[18, -46], [12, -99], [29, -174]],
  [[2, -56], [16, -107], [22, -151]], [[11, -43], [25, -117], [7, -162]], [[8, -57], [1, -105], [27, -172]],
  [[16, -50], [7, -92], [20, -168]], [[3, -45], [22, -111], [14, -155]], [[19, -54], [10, -101], [26, -175]],
  [[5, -48], [24, -115], [12, -164]], [[12, -59], [4, -98], [23, -152]], [[7, -41], [19, -108], [30, -170]],
] as const;
const tickets = (number: number, x: number, y: number) => TICKET_OFFSETS[number - 3].map(([dx, dy], index) => ({ id: `ticket-${number}-${index + 1}`, position: { x: x + dx, y: y + dy } }));
const CORD_X_OFFSETS = [-18, 24, -31, 35, -42, 16, 29, -25, 38, -12] as const;
const singleCord = (number: number, x: number, y: number) => [{ id: `room-${number}-cord`, anchor: { x: x + CORD_X_OFFSETS[number - 3], y: y - 190 }, length: 190, angle: CORD_X_OFFSETS[number - 3] / 190 }];
const splitCords = (number: number, x: number, y: number) => [
  { id: `room-${number}-left-cord`, anchor: { x: x - (65 + (number % 4) * 9), y: y - (158 + (number % 3) * 11) }, length: 190, angle: 0.45 },
  { id: `room-${number}-right-cord`, anchor: { x: x + (72 + (number % 5) * 7), y: y - (166 + (number % 2) * 13) }, length: 190, angle: -0.45 },
];
const baseOriginal = (number: number, title: string, subtitle: string, x: number, y: number, cords = singleCord(number, x, y)): RoomDefinition => ({
  id: brief(number).id, title, subtitle, wing: "campaign", source: ORIGINAL_SOURCE, kind: "drop", keyStart: { x, y }, cords,
  tickets: tickets(number, x, y), goal: { x: x + 35, y: 680 }, props: [], elements: [bubble(number, x, y)],
});

export const CAMPAIGN_ROOMS: readonly RoomDefinition[] = [
  {
    id: "campaign-01-draft-gallery",
    title: "The Draft Gallery",
    subtitle: "Clear the bubble, cut the velvet, and let the gallery draft carry the key.",
    wing: "campaign",
    source: mlgropeSource("levels/0.csv"),
    kind: "bellows",
    keyStart: { x: 176, y: 238 },
    cords: [{ id: "gallery-cord", anchor: { x: 176, y: 92 }, length: 146, angle: 0 }],
    tickets: [
      { id: "ticket-gallery-rise", position: { x: 240, y: 142 } },
      { id: "ticket-gallery-rafters", position: { x: 263, y: 60 } },
      { id: "ticket-gallery-return", position: { x: 343, y: 356 } },
    ],
    goal: { x: 210, y: 655 },
    props: [{ kind: "bumper", position: { x: 372, y: 518 }, radius: 42 }],
    elements: [
      { id: "gallery-bubble", kind: "bubble", position: { x: 184, y: 397 }, captureRadius: 42, buoyancy: 0.003, popRadius: 58 },
      { id: "gallery-draft", kind: "air-jet", position: { x: 74, y: 470 }, zone: { x: 112, y: 300, width: 250, height: 330 }, direction: { x: 1, y: 0.08 }, strength: 0.00035, mode: "continuous", tapRadius: 44 },
      { id: "gallery-weight", kind: "counterweight", position: { x: 422, y: 318 }, radius: 25, mass: 1.5, restitution: 0.58 },
      { id: "gallery-hazard", kind: "reset-hazard", bounds: { x: 404, y: 704, width: 105, height: 28 }, reason: "The key reached the broken orchestra pit." },
    ],
  },
  {
    id: "campaign-02-bubble-column",
    title: "The Bubble Column",
    subtitle: "Pop the stacked bubbles, then open the straight path to the lock.",
    wing: "campaign",
    source: mlgropeSource("levels/1.csv"),
    kind: "drop",
    keyStart: { x: 280, y: 180 },
    cords: [{ id: "column-cord", anchor: { x: 280, y: 76 }, length: 104, angle: 0 }],
    tickets: [
      { id: "ticket-column-upper", position: { x: 269, y: 428 } },
      { id: "ticket-column-middle", position: { x: 267, y: 519 } },
      { id: "ticket-column-lower", position: { x: 265, y: 622 } },
    ],
    goal: { x: 298, y: 696 },
    props: [],
    elements: [
      { id: "column-bubble-upper", kind: "bubble", position: { x: 282, y: 354 }, captureRadius: 36, buoyancy: 0.003, popRadius: 54 },
      { id: "column-bubble-lower", kind: "bubble", position: { x: 290, y: 526 }, captureRadius: 36, buoyancy: 0.003, popRadius: 54 },
      { id: "column-weight-upper", kind: "counterweight", position: { x: 410, y: 286 }, radius: 23, mass: 1.3, restitution: 0.52 },
      { id: "column-weight-lower", kind: "counterweight", position: { x: 146, y: 510 }, radius: 23, mass: 1.3, restitution: 0.52 },
      { id: "column-hazard", kind: "reset-hazard", bounds: { x: 404, y: 718, width: 106, height: 26 }, reason: "The key slipped into the torn stage floor." },
    ],
  },
  { ...baseOriginal(3, "Curtain Call", "Clear the bubble, release, then sound the opening bellows toward the lock.", 250, 300), goal: { x: 329, y: 680 }, elements: [bubble(3, 250, 300), { id: "room-3-bellows", kind: "air-jet", position: { x: 82, y: 430 }, zone: { x: 205, y: 295, width: 285, height: 390 }, direction: { x: 1, y: 0 }, strength: 0.012, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(4, "Whisper Lift", "Let the quiet leftward draft bend the descent into its lock lane.", 310, 300), goal: { x: 280, y: 680 }, elements: [bubble(4, 310, 300), { id: "room-4-draft", kind: "air-jet", position: { x: 485, y: 440 }, zone: { x: 170, y: 305, width: 330, height: 375 }, direction: { x: -1, y: 0 }, strength: 0.0007, mode: "continuous", tapRadius: 44 }, { id: "room-4-ticket-bellows", kind: "air-jet", position: { x: 492, y: 520 }, zone: { x: 170, y: 300, width: 330, height: 390 }, direction: { x: -1, y: 0 }, strength: 0.025, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(5, "Draft Mark", "Ride the pale cross-draft into the offset lock lane.", 220, 305), goal: { x: 300, y: 680 }, elements: [bubble(5, 220, 305), { id: "room-5-draft", kind: "air-jet", position: { x: 105, y: 450 }, zone: { x: 150, y: 315, width: 250, height: 360 }, direction: { x: 1, y: 0 }, strength: 0.0003, mode: "continuous", tapRadius: 44 }] },
  { ...baseOriginal(6, "Soft Rebound", "Release onto the velvet bumper and follow its safe leftward bank.", 330, 240), goal: { x: 180, y: 670 }, props: [{ kind: "bumper", position: { x: 400, y: 500 }, radius: 58 }] },
  { ...baseOriginal(7, "Stage-Left Cue", "Wait for the swing, then use one broad leftward bellows beat.", 300, 240), goal: { x: 125, y: 680 }, elements: [bubble(7, 300, 240), { id: "room-7-ticket-bellows", kind: "air-jet", position: { x: 485, y: 430 }, zone: { x: 120, y: 220, width: 360, height: 470 }, direction: { x: -1, y: 0 }, strength: 0.025, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(8, "Trapdoor Chalk", "Puff right before the striped center trapdoor reaches the key.", 300, 310), goal: { x: 450, y: 680 }, elements: [bubble(8, 300, 310), { id: "room-8-bellows", kind: "air-jet", position: { x: 92, y: 420 }, zone: { x: 250, y: 300, width: 280, height: 390 }, direction: { x: 1, y: 0 }, strength: 0.025, mode: "tap", tapRadius: 50 }, { id: "room-8-center-trap", kind: "reset-hazard", bounds: { x: 320, y: 590, width: 12, height: 145 }, reason: "The key reached the chalked trapdoor." }] },
  { ...baseOriginal(9, "Breath and Buoyancy", "Clear the lift, then use one bellows beat to cross into the lock lane.", 250, 305), goal: { x: 328, y: 680 }, elements: [bubble(9, 250, 305), { id: "room-9-bellows", kind: "air-jet", position: { x: 94, y: 440 }, zone: { x: 205, y: 300, width: 260, height: 390 }, direction: { x: 1, y: 0 }, strength: 0.012, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(10, "Balcony Bank", "Use the balcony bumper to reverse the falling key toward the lock.", 330, 245), goal: { x: 180, y: 675 }, props: [{ kind: "bumper", position: { x: 400, y: 500 }, radius: 58 }] },
  { ...baseOriginal(11, "Countercue Draft", "Wait for the swing, then answer with one broad rightward bellows beat.", 300, 245), goal: { x: 450, y: 680 }, elements: [bubble(11, 300, 245), { id: "room-11-ticket-bellows", kind: "air-jet", position: { x: 90, y: 430 }, zone: { x: 180, y: 220, width: 330, height: 470 }, direction: { x: 1, y: 0 }, strength: 0.016, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(12, "Crosswind Matinee", "Let the steady wind carry right, then answer with one leftward bellows cue.", 280, 305), goal: { x: 335, y: 680 }, elements: [bubble(12, 280, 305), { id: "room-12-draft", kind: "air-jet", position: { x: 85, y: 430 }, zone: { x: 220, y: 310, width: 265, height: 380 }, direction: { x: 1, y: 0 }, strength: 0.00055, mode: "continuous", tapRadius: 44 }, { id: "room-12-bellows", kind: "air-jet", position: { x: 485, y: 470 }, zone: { x: 220, y: 330, width: 270, height: 350 }, direction: { x: -1, y: 0 }, strength: 0.012, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(13, "Split Velvet", "Cut both velvet lines and let the low draft finish the crossing.", 255, 305, splitCords(13, 255, 305)), goal: { x: 335, y: 680 }, elements: [bubble(13, 255, 305), { id: "room-13-draft", kind: "air-jet", position: { x: 88, y: 455 }, zone: { x: 200, y: 320, width: 260, height: 365 }, direction: { x: 1, y: 0 }, strength: 0.0003, mode: "continuous", tapRadius: 44 }] },
  { ...baseOriginal(14, "Twin Cue Wings", "Release both wings, then answer with one leftward bellows cue.", 285, 300, splitCords(14, 285, 300)), goal: { x: 270, y: 680 }, elements: [bubble(14, 285, 300), { id: "room-14-bellows", kind: "air-jet", position: { x: 490, y: 445 }, zone: { x: 170, y: 295, width: 330, height: 390 }, direction: { x: -1, y: 0 }, strength: 0.015, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(15, "Orchestra Crossing", "Release both lines into the cross-draft before the torn pit.", 235, 305, splitCords(15, 235, 305)), goal: { x: 315, y: 680 }, elements: [bubble(15, 235, 305), { id: "room-15-draft", kind: "air-jet", position: { x: 90, y: 430 }, zone: { x: 175, y: 310, width: 250, height: 380 }, direction: { x: 1, y: 0.03 }, strength: 0.0003, mode: "continuous", tapRadius: 44 }, { id: "room-15-pit", kind: "reset-hazard", bounds: { x: 170, y: 690, width: 70, height: 32 }, reason: "The key reached the torn orchestra pit." }] },
  { ...baseOriginal(16, "Prop Room Passage", "Release both lines onto the bumper passage.", 330, 245, splitCords(16, 330, 245)), goal: { x: 180, y: 675 }, props: [{ kind: "bumper", position: { x: 400, y: 500 }, radius: 58 }] },
  { ...baseOriginal(17, "Echoing Flyloft", "Release into the loft wind, then counter it with the marked bellows.", 225, 305, splitCords(17, 225, 305)), goal: { x: 285, y: 680 }, elements: [bubble(17, 225, 305), { id: "room-17-draft", kind: "air-jet", position: { x: 82, y: 410 }, zone: { x: 165, y: 300, width: 290, height: 390 }, direction: { x: 1, y: 0 }, strength: 0.00042, mode: "continuous", tapRadius: 44 }, { id: "room-17-bellows", kind: "air-jet", position: { x: 485, y: 500 }, zone: { x: 180, y: 340, width: 285, height: 350 }, direction: { x: -1, y: 0 }, strength: 0.009, mode: "tap", tapRadius: 50 }] },
  { ...baseOriginal(18, "Crosswind Chorus", "Two releases feed a long leftward chorus into the lock.", 300, 300, splitCords(18, 300, 300)), goal: { x: 265, y: 680 }, elements: [bubble(18, 300, 300), { id: "room-18-draft", kind: "air-jet", position: { x: 488, y: 450 }, zone: { x: 160, y: 305, width: 340, height: 380 }, direction: { x: -1, y: 0 }, strength: 0.0007, mode: "continuous", tapRadius: 44 }, { id: "room-18-ticket-bellows", kind: "air-jet", position: { x: 490, y: 530 }, zone: { x: 160, y: 300, width: 340, height: 390 }, direction: { x: -1, y: 0 }, strength: 0.025, mode: "tap", tapRadius: 50 }, { id: "room-18-trap", kind: "reset-hazard", bounds: { x: 430, y: 700, width: 95, height: 30 }, reason: "The key found the broken prompt corner." }] },
  { ...baseOriginal(19, "Last Rehearsal", "Release both lines and bank around the final prop.", 330, 245, splitCords(19, 330, 245)), goal: { x: 190, y: 675 }, props: [{ kind: "bumper", position: { x: 410, y: 500 }, radius: 58 }], elements: [bubble(19, 330, 245), { id: "room-19-trap", kind: "reset-hazard", bounds: { x: 400, y: 690, width: 120, height: 28 }, reason: "The key reached the broken scenery hatch." }] },
  { ...baseOriginal(20, "House Lights", "Release both lines and use the final velvet bank home.", 330, 245, splitCords(20, 330, 245)), goal: { x: 195, y: 675 }, props: [{ kind: "bumper", position: { x: 410, y: 500 }, radius: 58 }, { kind: "bumper", position: { x: 105, y: 565 }, radius: 38 }], elements: [bubble(20, 330, 245), { id: "room-20-left-trap", kind: "reset-hazard", bounds: { x: 35, y: 705, width: 100, height: 26 }, reason: "The key slipped behind the left scenery flat." }, { id: "room-20-right-trap", kind: "reset-hazard", bounds: { x: 425, y: 705, width: 100, height: 26 }, reason: "The key slipped behind the right scenery flat." }] },
];
export const PROTOTYPE_ROOMS: readonly RoomDefinition[] = [
  { id: "velvet-descent", title: "The Velvet Descent", subtitle: "One clean cut. Let the key fall.", wing: "prototype", source: PROTOTYPE_SOURCE, kind: "drop", keyStart: { x: 280, y: 259 }, cords: [{ id: "cord-a", anchor: { x: 280, y: 114 }, length: 145, angle: 0 }], tickets: [{ id: "ticket-a", position: { x: 202, y: 353 } }, { id: "ticket-b", position: { x: 280, y: 448 } }, { id: "ticket-c", position: { x: 358, y: 353 } }], goal: { x: 280, y: 657 }, props: [] },
  { id: "moonlit-swing", title: "Moonlit Swing", subtitle: "Cut the upper cord, then release the swing.", wing: "prototype", source: PROTOTYPE_SOURCE, kind: "pendulum", keyStart: { x: 212, y: 320 }, cords: [{ id: "cord-left", anchor: { x: 144, y: 125 }, length: 206, angle: 0.62 }, { id: "cord-right", anchor: { x: 416, y: 125 }, length: 282, angle: 2.52 }], tickets: [{ id: "ticket-a", position: { x: 175, y: 434 } }, { id: "ticket-b", position: { x: 280, y: 549 } }, { id: "ticket-c", position: { x: 385, y: 434 } }], goal: { x: 280, y: 677 }, props: [] },
  { id: "bellows-backstage", title: "Backstage Bellows", subtitle: "Cut the cord, then puff from the left to let the bumper send the key to the lock.", wing: "prototype", source: PROTOTYPE_SOURCE, kind: "bellows", keyStart: { x: 175, y: 320 }, cords: [{ id: "cord-stage", anchor: { x: 175, y: 120 }, length: 200, angle: 0 }], tickets: [{ id: "ticket-a", position: { x: 249, y: 353 } }, { id: "ticket-b", position: { x: 351, y: 428 } }, { id: "ticket-c", position: { x: 253, y: 542 } }], goal: { x: 450, y: 603 }, props: [{ kind: "bumper", position: { x: 144, y: 428 }, radius: 51 }, { kind: "bellows", position: { x: 93, y: 299 }, radius: 41 }] }
];

export const ROOMS: readonly RoomDefinition[] = Object.freeze([...CAMPAIGN_ROOMS, ...PROTOTYPE_ROOMS]);
export const KEYFALL_CATALOG = new CampaignCatalog(ROOMS, new RoomValidator(GAME_VIEWPORT));

export function roomById(id: string): RoomDefinition { return KEYFALL_CATALOG.roomById(id) ?? PROTOTYPE_ROOMS[0]; }
