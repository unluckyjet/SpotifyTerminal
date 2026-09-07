import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export type Bookmark={id:string;position:number;label:string};
const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
const valid=(value:unknown):value is Bookmark=>{
  if(!value||typeof value!=='object')return false;
  const item=value as Record<string,unknown>;
  return typeof item.id==='string'&&typeof item.position==='number'&&Number.isFinite(item.position)&&typeof item.label==='string';
};
export class BookmarkStore {
  items:Bookmark[]=[];
  private serial=Promise.resolve();
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'bookmarks.json'),'utf8'));
      if(Array.isArray(parsed))this.items=parsed.filter(valid).map(b=>({id:b.id,position:Math.max(0,b.position),label:b.label}));
    }catch{this.items=[];}
  }
  async add(id:string,position:number,label?:string){
    const pos=Math.max(0,Number.isFinite(position)?position:0);
    const bookmark:Bookmark={id,position:pos,label:label??clock(pos)};
    this.items=this.items.filter(b=>b.id!==id||b.position!==pos).concat(bookmark);
    await this.persist();return bookmark;
  }
  async remove(id:string,position:number){
    const next=this.items.filter(b=>b.id!==id||b.position!==position);
    if(next.length===this.items.length)return false;
    this.items=next;await this.persist();return true;
  }
  forTrack(id:string){return this.items.filter(b=>b.id===id).sort((a,b)=>a.position-b.position);}
  nearest(id:string,position:number){
    return this.forTrack(id).reduce<Bookmark|undefined>((best,item)=>!best||Math.abs(position-item.position)<Math.abs(position-best.position)?item:best,undefined);
  }
  private persist(){
    const snapshot=JSON.stringify(this.items,null,2);
    this.serial=this.serial.catch(()=>{}).then(async()=>{
      await mkdir(this.directory,{recursive:true});
      const temp=join(this.directory,`bookmarks-${process.pid}.tmp`);
      await writeFile(temp,snapshot);await rename(temp,join(this.directory,'bookmarks.json'));
    });
    return this.serial;
  }
}
