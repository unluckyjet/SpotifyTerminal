import {join} from 'node:path';

const stamp=(s:number)=>{
  const t=Math.floor(Math.max(0,Number.isFinite(s)?s:0));
  return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
};

export function formatStatusFile(track:{name:string;artist:string;album:string;playing:boolean;position:number;duration:number},extra?:string){
  const body=`${track.playing?'▶':'Ⅱ'} ${track.name} — ${track.artist}\n${track.album} | ${stamp(track.position)}/${stamp(track.duration)}`;
  return extra?`${body}\n${extra}`:body;
}

export function statusFilePath(directory:string){
  return join(directory,'now-playing.txt');
}
