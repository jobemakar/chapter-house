import type { Part } from "./types";
export const CONTRAPTION_SAVE_KEY="popcorn-contraption.levels.v2";
export const LEGACY_SAVE_KEY="popcorn-contraption.v1";
export const CONTRAPTION_REWARD_IDS=["popcorn:cc-spring-ornament","popcorn:cc-mini-machine"] as const;
export const LEGACY_REWARD_IDS=["cc-spring-ornament","cc-mini-machine"] as const;
export interface ContraptionProgress{version:2;board:number;delivered:number;best:number;ownedRewardIds:string[];cleared:number[];layouts:Part[][];mute:boolean;slow:boolean;trails:boolean}
const int=(v:unknown,d=0)=>typeof v==="number"&&Number.isFinite(v)&&v>=0?Math.floor(v):d;
const bool=(v:unknown,d:boolean)=>typeof v==="boolean"?v:d;
export function freshContraptionProgress():ContraptionProgress{return{version:2,board:0,delivered:0,best:0,ownedRewardIds:[],cleared:[],layouts:[],mute:false,slow:false,trails:true}}
/** Validates v2 and imports totals/preferences/rewards only from untouched v1. Layout normalization belongs to the campaign catalog. */
export function loadContraptionProgress(raw:unknown):ContraptionProgress{const o=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};const p=freshContraptionProgress();p.delivered=int(o.delivered);p.best=int(o.best);p.mute=bool(o.mute,false);p.slow=bool(o.slow,false);p.trails=bool(o.trails,true);const owned=Array.isArray(o.ownedRewardIds)?o.ownedRewardIds:Array.isArray(o.owned)?o.owned:[];p.ownedRewardIds=[...new Set(owned.filter((x):x is string=>typeof x==="string").flatMap(x=>{const i=LEGACY_REWARD_IDS.indexOf(x as typeof LEGACY_REWARD_IDS[number]);return i<0?[x]:[CONTRAPTION_REWARD_IDS[i]]}))];for(const [i,at] of [5,20].entries())if(p.delivered>=at&&!p.ownedRewardIds.includes(CONTRAPTION_REWARD_IDS[i]))p.ownedRewardIds.push(CONTRAPTION_REWARD_IDS[i]);if(o.version===2){p.board=Math.min(5,int(o.board));p.cleared=[...new Set((Array.isArray(o.cleared)?o.cleared:[]).filter((x):x is number=>Number.isInteger(x)&&x>=0&&x<6))];p.layouts=(Array.isArray(o.layouts)?o.layouts:[]).filter(Array.isArray) as Part[][]}return p}
