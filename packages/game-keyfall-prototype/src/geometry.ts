import type { Vec } from "./types";
export function distance(a: Vec, b: Vec): number { return Math.hypot(a.x - b.x, a.y - b.y); }
export function pointOnCord(anchor: Vec, length: number, angle: number): Vec { return { x: anchor.x + Math.sin(angle) * length, y: anchor.y + Math.cos(angle) * length }; }
export function segmentDistance(point: Vec, start: Vec, end: Vec): number { const dx = end.x - start.x, dy = end.y - start.y; const denom = dx * dx + dy * dy; const t = denom === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / denom)); return distance(point, { x: start.x + t * dx, y: start.y + t * dy }); }
export function segmentsIntersect(a: Vec, b: Vec, c: Vec, d: Vec, tolerance = 0): boolean { return segmentDistance(a, c, d) <= tolerance || segmentDistance(b, c, d) <= tolerance || segmentDistance(c, a, b) <= tolerance || segmentDistance(d, a, b) <= tolerance || (ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)); }
function ccw(a: Vec, b: Vec, c: Vec): boolean { return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x); }
export function swipeHitsCord(swipeStart: Vec, swipeEnd: Vec, anchor: Vec, keyPosition: Vec, tolerance = 14): boolean { return segmentsIntersect(swipeStart, swipeEnd, anchor, keyPosition, tolerance); }
export function shouldGentleReset(position: Vec, goal: Vec, width = 800, height = 560): boolean { const outside = position.x < -40 || position.x > width + 40 || position.y < -50 || position.y > height + 60; return outside && distance(position, goal) > 48; }
