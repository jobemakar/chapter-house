import type { RoomDefinition, RoomWing, Vec, Viewport } from "./types";

export const CAMPAIGN_ROOM_TARGET = 20;
export const PROTOTYPE_ROOM_TARGET = 3;

export type CatalogValidation = Readonly<{
  errors: readonly string[];
  campaignCount: number;
  prototypeCount: number;
  campaignComplete: boolean;
}>;

export class RoomValidator {
  constructor(private readonly viewport: Viewport) {}

  validate(room: RoomDefinition): readonly string[] {
    const errors: string[] = [];
    if (!room.id.trim()) errors.push("Room id is required");
    if (!room.title.trim()) errors.push(`${room.id}: title is required`);
    if (room.wing === "campaign" && room.tickets.length !== 3) errors.push(`${room.id}: campaign rooms require exactly three tickets`);
    if (room.wing === "prototype" && room.source.kind !== "keyfall-prototype") errors.push(`${room.id}: prototype rooms require keyfall-prototype source metadata`);
    if (room.wing === "campaign" && room.source.kind === "keyfall-prototype") errors.push(`${room.id}: campaign rooms require original or mlgrope source metadata`);
    if (room.source.kind === "mlgrope-mit-adaptation" && room.wing !== "campaign") errors.push(`${room.id}: mlgrope adaptations belong in the campaign wing`);

    const ids = [...room.cords.map((cord) => cord.id), ...room.tickets.map((ticket) => ticket.id), ...(room.elements ?? []).map((element) => element.id)];
    if (new Set(ids).size !== ids.length) errors.push(`${room.id}: cord, ticket, and element ids must be unique within the room`);
    const points: readonly [string, Vec][] = [
      ["key", room.keyStart], ["goal", room.goal],
      ...room.cords.map((cord): [string, Vec] => [`cord ${cord.id}`, cord.anchor]),
      ...room.tickets.map((ticket): [string, Vec] => [`ticket ${ticket.id}`, ticket.position]),
      ...room.props.map((prop, index): [string, Vec] => [`prop ${index + 1}`, prop.position]),
      ...(room.elements ?? []).flatMap((element): [string, Vec][] => {
        if (element.kind === "bubble" || element.kind === "counterweight") return [[`element ${element.id}`, element.position]];
        if (element.kind === "air-jet") return [[`element ${element.id}`, element.position], [`element ${element.id} zone start`, { x: element.zone.x, y: element.zone.y }], [`element ${element.id} zone end`, { x: element.zone.x + element.zone.width, y: element.zone.y + element.zone.height }]];
        return [[`element ${element.id} start`, { x: element.bounds.x, y: element.bounds.y }], [`element ${element.id} end`, { x: element.bounds.x + element.bounds.width, y: element.bounds.y + element.bounds.height }]];
      })
    ];
    for (const [label, point] of points) {
      if (!this.inBounds(point)) errors.push(`${room.id}: ${label} is outside the ${this.viewport.width}x${this.viewport.height} playfield`);
    }
    for (const element of room.elements ?? []) {
      if (!element.id.trim()) errors.push(`${room.id}: world element id is required`);
      if (element.kind === "air-jet") {
        if (!isPositive(element.zone.width) || !isPositive(element.zone.height)) errors.push(`${room.id}: air jet ${element.id} requires a positive zone`);
        if (!Number.isFinite(element.direction.x) || !Number.isFinite(element.direction.y) || Math.hypot(element.direction.x, element.direction.y) === 0) errors.push(`${room.id}: air jet ${element.id} requires a direction`);
        if (!isPositive(element.strength) || !isPositive(element.tapRadius)) errors.push(`${room.id}: air jet ${element.id} requires positive strength and tap radius`);
      }
      if (element.kind === "bubble" && (!isPositive(element.captureRadius) || !isPositive(element.buoyancy) || !isPositive(element.popRadius))) errors.push(`${room.id}: bubble ${element.id} requires positive radius, buoyancy, and pop radius`);
      if (element.kind === "counterweight" && (!isPositive(element.radius) || !isPositive(element.mass) || !Number.isFinite(element.restitution) || element.restitution < 0)) errors.push(`${room.id}: counterweight ${element.id} requires positive radius/mass and nonnegative restitution`);
      if (element.kind === "reset-hazard") {
        if (!isPositive(element.bounds.width) || !isPositive(element.bounds.height)) errors.push(`${room.id}: hazard ${element.id} requires positive bounds`);
        if (!element.reason.trim()) errors.push(`${room.id}: hazard ${element.id} requires a reset reason`);
      }
    }
    return errors;
  }

  validateCatalog(rooms: readonly RoomDefinition[]): CatalogValidation {
    const errors = rooms.flatMap((room) => this.validate(room));
    const ids = rooms.map((room) => room.id);
    for (const duplicate of ids.filter((id, index) => ids.indexOf(id) !== index)) errors.push(`Duplicate room id: ${duplicate}`);
    const campaignCount = rooms.filter((room) => room.wing === "campaign").length;
    const prototypeCount = rooms.filter((room) => room.wing === "prototype").length;
    const adaptations = rooms.filter((room) => room.source.kind === "mlgrope-mit-adaptation");
    const adaptationPaths = adaptations.map((room) => room.source.kind === "mlgrope-mit-adaptation" ? room.source.path : "");
    if (adaptations.length > 2) errors.push(`Campaign permits at most 2 mlgrope adaptations; found ${adaptations.length}`);
    for (const path of ["levels/0.csv", "levels/1.csv"] as const) {
      const count = adaptationPaths.filter((candidate) => candidate === path).length;
      if (count > 1) errors.push(`Campaign permits at most one adaptation of ${path}; found ${count}`);
    }
    if (campaignCount > CAMPAIGN_ROOM_TARGET) errors.push(`Campaign exceeds ${CAMPAIGN_ROOM_TARGET} rooms`);
    if (campaignCount === CAMPAIGN_ROOM_TARGET) {
      const campaign = rooms.filter((room) => room.wing === "campaign");
      const originalCount = campaign.filter((room) => room.source.kind === "original").length;
      const campaignAdaptations = campaign.filter((room) => room.source.kind === "mlgrope-mit-adaptation");
      const level0Count = campaignAdaptations.filter((room) => room.source.kind === "mlgrope-mit-adaptation" && room.source.path === "levels/0.csv").length;
      const level1Count = campaignAdaptations.filter((room) => room.source.kind === "mlgrope-mit-adaptation" && room.source.path === "levels/1.csv").length;
      if (originalCount !== 18) errors.push(`Complete campaign requires exactly 18 original rooms; found ${originalCount}`);
      if (campaignAdaptations.length !== 2) errors.push(`Complete campaign requires exactly 2 mlgrope adaptations; found ${campaignAdaptations.length}`);
      if (level0Count !== 1) errors.push(`Complete campaign requires exactly one adaptation of levels/0.csv; found ${level0Count}`);
      if (level1Count !== 1) errors.push(`Complete campaign requires exactly one adaptation of levels/1.csv; found ${level1Count}`);
    }
    if (prototypeCount !== PROTOTYPE_ROOM_TARGET) errors.push(`Prototype wing requires ${PROTOTYPE_ROOM_TARGET} rooms`);
    return Object.freeze({ errors: Object.freeze([...new Set(errors)]), campaignCount, prototypeCount, campaignComplete: campaignCount === CAMPAIGN_ROOM_TARGET });
  }

  private inBounds(point: Vec): boolean {
    return Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= this.viewport.width && point.y >= 0 && point.y <= this.viewport.height;
  }
}

function isPositive(value: number): boolean { return Number.isFinite(value) && value > 0; }

export class CampaignCatalog {
  readonly validation: CatalogValidation;

  constructor(private readonly definitions: readonly RoomDefinition[], validator: RoomValidator) {
    this.validation = validator.validateCatalog(definitions);
    if (this.validation.errors.length) throw new Error(`Invalid Keyfall catalog:\n${this.validation.errors.join("\n")}`);
  }

  all(): readonly RoomDefinition[] { return this.definitions; }
  roomsForWing(wing: RoomWing): readonly RoomDefinition[] { return this.definitions.filter((room) => room.wing === wing); }
  roomById(id: string): RoomDefinition | undefined { return this.definitions.find((room) => room.id === id); }
  indexOf(id: string): number { return this.definitions.findIndex((room) => room.id === id); }
}
