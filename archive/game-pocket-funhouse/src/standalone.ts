import type { GameHostServices } from "@chapter-house/game-host";
import { PocketFunhouseGame } from "./game";
import { loadPocketFunhouseProgress, toLegacyPocketFunhouseSave, type PocketFunhouseProgress } from "./progress";
import "./style.css";

const key = "pocket-funhouse-v1";
function read(): { progress: PocketFunhouseProgress; muted: boolean } { try { const raw: unknown=JSON.parse(localStorage.getItem(key)??"null"); const record=raw&&typeof raw==="object" ? raw as Record<string,unknown> : {}; return {progress:loadPocketFunhouseProgress(record),muted:record.muted===true}; } catch { return {progress:loadPocketFunhouseProgress(null),muted:false}; } }
const stored=read();
const host: GameHostServices<PocketFunhouseProgress>={progress:stored.progress,muted:stored.muted,reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,activePlaySeconds:0,exit:()=>{window.location.hash="exit";},notify:(message)=>console.info(message),saveProgress:(progress)=>{stored.progress=progress;try{localStorage.setItem(key,JSON.stringify(toLegacyPocketFunhouseSave(progress,stored.muted)));}catch{/* playable without storage */}},creditActivePlay:()=>0,awardReward:()=>true};
new PocketFunhouseGame(document.getElementById("pocket-funhouse-root")!,host,{showStandaloneControls:true,onMutedChanged:(muted)=>{stored.muted=muted;try{localStorage.setItem(key,JSON.stringify(toLegacyPocketFunhouseSave(stored.progress,muted)));}catch{/* playable without storage */}}});
