import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {dataDirectory} from './history';
export type LyricLine={time:number;text:string};
export function parseLRC(source:string):LyricLine[]{
  const offset=Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1]??0)/1000;
  const lines:LyricLine[]=[];
  for(const row of source.replace(/^\uFEFF/,'').split(/\r?\n/)){
    const tags=[...row.matchAll(/\[(\d+):([0-5]?\d)(?:\.(\d{1,3}))?\]/g)];
    const text=row.replace(/\[[^\]]*\]/g,'').replace(/<\d+:\d+(?:\.\d+)?>/g,'').replace(/[\x00-\x1f\x7f]/g,'').trim();
    if(!text)continue;
    for(const tag of tags){const time=Number(tag[1])*60+Number(tag[2])+Number(`0.${tag[3]??0}`)-offset;if(Number.isFinite(time))lines.push({time:Math.max(0,time),text});}
  }
  return lines.sort((a,b)=>a.time-b.time);
}
export function lyricIndex(lines:LyricLine[],position:number){
  let low=0,high=lines.length-1,result=-1;
  while(low<=high){const mid=(low+high)>>1;if(lines[mid].time<=position){result=mid;low=mid+1;}else high=mid-1;}
  return result;
}
export class LyricsLibrary{
  constructor(readonly directory=join(dataDirectory,'lyrics')){}
  private path(id:string){return join(this.directory,createHash('sha256').update(id).digest('hex')+'.lrc');}
  async load(id:string){try{return parseLRC(await readFile(this.path(id),'utf8'));}catch{return [];}}
  async import(id:string,path:string){
    if(!id)throw new Error('Select a Spotify track first');
    path=path.trim().replace(/^(['"])(.*)\1$/,'$2');if(path.startsWith('~/'))path=join(homedir(),path.slice(2));
    if(!/\.lrc$/i.test(path))throw new Error('Choose an .lrc file');
    if((await stat(path)).size>2_000_000)throw new Error('Lyrics file is too large');
    const source=await readFile(path,'utf8'),lines=parseLRC(source);
    if(!lines.length)throw new Error('No timestamped lyrics found');
    await mkdir(this.directory,{recursive:true});await writeFile(this.path(id),source);return lines;
  }
}
