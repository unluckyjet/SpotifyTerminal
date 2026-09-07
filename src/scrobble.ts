import {mkdir,readFile,rename,writeFile,appendFile} from 'node:fs/promises';
import {join} from 'node:path';
import {encodeJsonl} from './jsonl';
export function shouldScrobble(position:number,duration:number){
  return duration>0&&(position>=duration*0.5||position>=240);
}
export class ScrobbleLog {
  entries:{id:string;name:string;artist:string;playedAt:string}[]=[];
  private seen=new Set<string>();
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'scrobbles.json'),'utf8'));
      if(Array.isArray(parsed))this.entries=parsed.filter(e=>e&&typeof e.id==='string'&&typeof e.name==='string'&&typeof e.artist==='string'&&typeof e.playedAt==='string').map(e=>({id:e.id,name:e.name,artist:e.artist,playedAt:e.playedAt}));
    }catch{this.entries=[];}
  }
  async maybeRecord(track:{id:string;name:string;artist:string;album:string;duration:number;position:number;playing:boolean}){
    if(!track.playing||!track.id||this.seen.has(track.id)||!shouldScrobble(track.position,track.duration))return false;
    this.seen.add(track.id);
    const entry={id:track.id,name:track.name,artist:track.artist,playedAt:new Date().toISOString()};
    this.entries.push(entry);
    await mkdir(this.directory,{recursive:true});
    const snapshot=JSON.stringify(this.entries,null,2);
    const temp=join(this.directory,`scrobbles-${process.pid}.tmp`);
    await writeFile(temp,snapshot);await rename(temp,join(this.directory,'scrobbles.json'));
    await appendFile(join(this.directory,'scrobbles.jsonl'),encodeJsonl(entry)+'\n');
    return true;
  }
}
