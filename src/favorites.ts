import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export class FavoriteStore {
  ids=new Set<string>();
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed=JSON.parse(await readFile(join(this.directory,'favorites.json'),'utf8'));
      this.ids=new Set(Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==='string'):[]);
    }catch{this.ids=new Set();}
  }
  has(id:string){return this.ids.has(id);}
  list(){return [...this.ids];}
  async toggle(id:string){
    if(this.ids.has(id))this.ids.delete(id);else this.ids.add(id);
    await mkdir(this.directory,{recursive:true});
    const temp=join(this.directory,`favorites-${process.pid}.tmp`);
    await writeFile(temp,JSON.stringify([...this.ids],null,2));
    await rename(temp,join(this.directory,'favorites.json'));
    return this.ids.has(id);
  }
}
