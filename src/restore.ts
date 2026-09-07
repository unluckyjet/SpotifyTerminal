import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export type SessionState={fullscreen:boolean;transitions:boolean;vim:boolean;repeat:'off'|'context'|'track';volume:number;lyricsOpen:boolean};
const flags=['fullscreen','transitions','vim','lyricsOpen'] as const;
export const defaultSession:SessionState={fullscreen:false,transitions:false,vim:false,repeat:'off',volume:50,lyricsOpen:false};
function pick(value:unknown):Partial<SessionState>{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const raw=value as Record<string,unknown>;
  const next:Partial<SessionState>={};
  for(const key of flags)if(typeof raw[key]==='boolean')next[key]=raw[key];
  if(raw.repeat==='off'||raw.repeat==='context'||raw.repeat==='track')next.repeat=raw.repeat;
  if(typeof raw.volume==='number'&&Number.isInteger(raw.volume)&&raw.volume>=0&&raw.volume<=100)next.volume=raw.volume;
  return next;
}
function parse(value:unknown):SessionState{return {...defaultSession,...pick(value)};}
export class SessionRestore {
  constructor(readonly directory:string){}
  async load(){
    try{return parse(JSON.parse(await readFile(join(this.directory,'session.json'),'utf8')));}
    catch{return {...defaultSession};}
  }
  async save(state:SessionState){
    await mkdir(this.directory,{recursive:true});
    const snapshot=JSON.stringify(parse(state),null,2);
    const temp=join(this.directory,`session-${process.pid}.tmp`);
    await writeFile(temp,snapshot);await rename(temp,join(this.directory,'session.json'));
  }
}
