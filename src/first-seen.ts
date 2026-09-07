import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export class FirstSeen {
  dates:Record<string,string>={};
  private serial=Promise.resolve();
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'first-seen.json'),'utf8'));
      const next:Record<string,string>={};
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))
        for(const id of Object.keys(parsed)){
          const value=parsed[id];
          if(typeof value==='string'&&Number.isFinite(Date.parse(value)))next[id]=value;
        }
      this.dates=next;
    }catch{this.dates={};}
  }
  record(id:string,at?:Date){
    if(!id)return Promise.resolve('');
    const existing=this.dates[id];
    if(existing)return Promise.resolve(existing);
    const when=at&&Number.isFinite(at.getTime())?at:new Date();
    const iso=when.toISOString();
    this.dates[id]=iso;
    const snapshot=JSON.stringify(this.dates,null,2);
    this.serial=this.serial.catch(()=>{}).then(async()=>{
      await mkdir(this.directory,{recursive:true});
      const temp=join(this.directory,`first-seen-${process.pid}.tmp`);
      await writeFile(temp,snapshot);await rename(temp,join(this.directory,'first-seen.json'));
    });
    return this.serial.then(()=>iso);
  }
  get(id:string){return this.dates[id];}
}
