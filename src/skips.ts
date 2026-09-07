import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export type SkipEvent={id:string;at:string};
export function isSkip(position:number,duration:number,threshold=0.5){
  return duration>0&&position/duration<threshold;
}
export class SkipLog{
  events:SkipEvent[]=[];
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'skips.json'),'utf8'));
      if(Array.isArray(parsed))this.events=parsed.filter(e=>e&&typeof e.id==='string'&&typeof e.at==='string').map(e=>({id:e.id,at:e.at}));
    }catch{this.events=[];}
  }
  async record(id:string,position:number,duration:number,at=new Date()){
    if(!isSkip(position,duration))return false;
    this.events.push({id,at:at.toISOString()});
    await mkdir(this.directory,{recursive:true});
    const snapshot=JSON.stringify(this.events,null,2);
    const temp=join(this.directory,`skips-${process.pid}.tmp`);
    await writeFile(temp,snapshot);await rename(temp,join(this.directory,'skips.json'));
    return true;
  }
  count(id:string){return this.events.filter(e=>e.id===id).length;}
}
