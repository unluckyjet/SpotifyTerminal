import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export class PlayCounts {
  counts:Record<string,number>={};
  private serial=Promise.resolve();
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'counts.json'),'utf8'));
      const next:Record<string,number>={};
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))
        for(const id of Object.keys(parsed)){
          const n=parsed[id];
          if(typeof n==='number'&&Number.isInteger(n)&&n>=0)next[id]=n;
        }
      this.counts=next;
    }catch{this.counts={};}
  }
  record(id:string){
    if(!id)return Promise.resolve(0);
    const n=(this.counts[id]??0)+1;
    this.counts[id]=n;
    const snapshot=JSON.stringify(this.counts,null,2);
    this.serial=this.serial.catch(()=>{}).then(async()=>{
      await mkdir(this.directory,{recursive:true});
      const temp=join(this.directory,`counts-${process.pid}.tmp`);
      await writeFile(temp,snapshot);await rename(temp,join(this.directory,'counts.json'));
    });
    return this.serial.then(()=>n);
  }
  count(id:string){return this.counts[id]??0;}
}
