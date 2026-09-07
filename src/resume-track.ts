import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
function parse(value:unknown):{id:string;position:number}|undefined{
  if(!value||typeof value!=='object'||Array.isArray(value))return;
  const raw=value as Record<string,unknown>;
  if(typeof raw.id!=='string')return;
  if(typeof raw.position!=='number'||!Number.isFinite(raw.position))return;
  return {id:raw.id,position:Math.max(0,raw.position)};
}
function clamp(position:number){return Math.max(0,Number.isFinite(position)?position:0);}
export async function applyResume(
  last:{id:string;position:number}|undefined,
  playUri:(id:string)=>Promise<unknown>,
  seek:(position:number)=>Promise<unknown>,
){
  if(!last?.id)return false;
  await playUri(last.id);
  if(last.position>0)await seek(last.position);
  return true;
}
export class LastTrack {
  constructor(readonly directory:string){}
  async load(){
    try{return parse(JSON.parse(await readFile(join(this.directory,'last.json'),'utf8')));}
    catch{return;}
  }
  async save(id:string,position:number){
    await mkdir(this.directory,{recursive:true});
    const snapshot=JSON.stringify({id,position:clamp(position)},null,2);
    const temp=join(this.directory,`last-${process.pid}.tmp`);
    await writeFile(temp,snapshot);await rename(temp,join(this.directory,'last.json'));
  }
}
