export class RateLimit {
  private hits:number[]=[];
  constructor(private max:number,private windowMs:number){}
  allow(now=Date.now()){
    const cutoff=now-this.windowMs;
    this.hits=this.hits.filter(t=>t>cutoff);
    if(this.hits.length>=this.max)return false;
    this.hits.push(now);
    return true;
  }
}
