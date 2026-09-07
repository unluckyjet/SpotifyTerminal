export class TtlCache<V> {
  private entries=new Map<string,{value:V;at:number}>();
  constructor(private ttlMs:number){}
  get(key:string,now=Date.now()){
    const hit=this.entries.get(key);
    if(hit===undefined||now-hit.at>=this.ttlMs){
      if(hit!==undefined)this.entries.delete(key);
      return undefined;
    }
    return hit.value;
  }
  set(key:string,value:V,now=Date.now()){
    this.entries.set(key,{value,at:now});
  }
}
