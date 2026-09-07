import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';

function validStars(stars:number){return Number.isInteger(stars)&&stars>=1&&stars<=5;}

export class RatingStore {
  scores:Record<string,number>={};
  constructor(readonly directory:string){}
  async load(){
    try{
      const parsed:unknown=JSON.parse(await readFile(join(this.directory,'ratings.json'),'utf8'));
      const scores:Record<string,number>={};
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
        for(const [id,value] of Object.entries(parsed as Record<string,unknown>))
          if(typeof value==='number'&&validStars(value))scores[id]=value;
      }
      this.scores=scores;
    }catch{this.scores={};}
  }
  async rate(id:string,stars:number){
    if(!validStars(stars))throw new Error('Stars must be an integer 1–5');
    this.scores[id]=stars;
    await mkdir(this.directory,{recursive:true});
    const temp=join(this.directory,`ratings-${process.pid}.tmp`);
    await writeFile(temp,JSON.stringify(this.scores,null,2));
    await rename(temp,join(this.directory,'ratings.json'));
  }
  get(id:string){return this.scores[id];}
  stars(id:string){
    const n=this.scores[id];
    return n===undefined?'':'★'.repeat(n)+'☆'.repeat(5-n);
  }
}
