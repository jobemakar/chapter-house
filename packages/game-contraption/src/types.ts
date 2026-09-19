export type PartType="ramp"|"belt"|"spring"|"fan"|"funnel"|"bumper"|"wall"|"switch";
export interface Point{x:number;y:number} export interface Part{id:string;type:PartType;x:number;y:number;angle:number;power:number;flip:number;locked?:boolean;targets?:string[];direction?:number}
export interface Inlet extends Point{vx:number} export interface Level{id:string;name:string;tag:string;hint:string;sources:Inlet[];period:number;bowl:Point;kit:Partial<Record<PartType,number>>;solution:Part[];initial:Part[]}
export interface Kernel{id:number;proof:number;inlet:number;x:number;y:number;vx:number;vy:number;r:number;age:number;delay:number;dead?:boolean;visits:string[];types:PartType[];cool:Record<string,number>;trail:Point[]}
export interface GameEvent{type:"delivery"|"return"|"clear"|"touch"|"switch";chain?:number;part?:PartType}
