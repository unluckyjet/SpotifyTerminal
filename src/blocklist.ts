import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export class Blocklist {
  ids=new Set<string>();
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'blocklist.json'),'utf8'));
      if(Array.isArray(parsed))this.ids=new Set(parsed.filter(id=>typeof id==='string'&&id!==''));
    }catch{this.ids=new Set();}
  }
  async add(id:string){
    if(id===''||this.ids.has(id))return;
    this.ids.add(id);
    await this.persist();
  }
  async remove(id:string){
    if(!this.ids.delete(id))return;
    await this.persist();
  }
  has(id:string){return id!==''&&this.ids.has(id);}
  shouldSkip(id:string){return this.has(id);}
  private async persist(){
    await mkdir(this.directory,{recursive:true});
    const temp=join(this.directory,`blocklist-${process.pid}.tmp`);
    await writeFile(temp,JSON.stringify([...this.ids],null,2));
    await rename(temp,join(this.directory,'blocklist.json'));
  }
}
