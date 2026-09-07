export class RingBuffer<T> {
  private items:T[]=[];
  constructor(private limit:number){
    this.limit=Number.isFinite(limit)?Math.max(0,Math.floor(limit)):0;
  }
  push(item:T){
    if(this.limit<=0)return;
    this.items.push(item);
    if(this.items.length>this.limit)this.items.shift();
  }
  values(){return this.items.slice();}
  last(){return this.items.at(-1);}
}
