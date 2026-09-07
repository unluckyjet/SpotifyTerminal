import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {Track} from './spotify';
import type {Artwork} from './cover';
export const dataDirectory=process.env.SPOTTERMINAL_DATA_DIR??join(process.env.XDG_DATA_HOME??join(homedir(),'Library','Application Support'),'Spotterminal');
export type HistoryEntry={id:string;name:string;artist:string;album:string;artwork:string;playedAt:string;coverKey?:string};
export class ListeningHistory {
  entries:HistoryEntry[]=[];
  private serial=Promise.resolve();
  private lastTrack='';
  private coverSaved='';
  constructor(readonly directory=dataDirectory){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'history.json'),'utf8'));
      if(Array.isArray(parsed))this.entries=parsed.filter(e=>e&&['id','name','artist','album','artwork','playedAt'].every(k=>typeof e[k]==='string')).map(e=>({...e,coverKey:typeof e.coverKey==='string'&&/^[a-f0-9]{64}$/.test(e.coverKey)?e.coverKey:undefined})).slice(0,200);
    }catch{this.entries=[];}
  }
  record(track:Track,artwork?:Artwork){
    if(!track.playing||!track.id)return this.serial;
    const changed=this.lastTrack!==track.id;
    if(changed){
      this.lastTrack=track.id;this.coverSaved='';
      this.entries=[{id:track.id,name:track.name,artist:track.artist,album:track.album,artwork:track.artwork,playedAt:new Date().toISOString()},...this.entries.filter(e=>e.id!==track.id)].slice(0,200);
    }
    if(!changed&&(!artwork||this.coverSaved===track.id))return this.serial;
    let coverKey:string|undefined;
    if(artwork){coverKey=createHash('sha256').update(artwork.encoded).digest('hex');this.coverSaved=track.id;}
    const current=this.entries.find(e=>e.id===track.id);if(current&&coverKey)current.coverKey=coverKey;
    const snapshot=JSON.stringify(this.entries,null,2);
    this.serial=this.serial.catch(()=>{}).then(async()=>{
      await mkdir(join(this.directory,'covers'),{recursive:true});
      if(coverKey&&artwork)await writeFile(join(this.directory,'covers',coverKey),artwork.encoded);
      const temp=join(this.directory,`history-${process.pid}.tmp`);
      await writeFile(temp,snapshot);await rename(temp,join(this.directory,'history.json'));
    });
    return this.serial;
  }
  async cover(entry:HistoryEntry):Promise<Buffer|undefined>{
    if(!entry.coverKey||!/^[a-f0-9]{64}$/.test(entry.coverKey))return;
    try{return await readFile(join(this.directory,'covers',entry.coverKey));}catch{return;}
  }
}
