export class ShuffleBag<T> {
  private original:T[];
  private bag:T[];
  private n=0;
  constructor(items:T[]){
    this.original=items.slice();
    this.bag=items.slice();
  }
  next(){
    if(!this.bag.length)this.bag=this.original.slice();
    const i=((this.n++*1103515245+12345)>>>0)%this.bag.length;
    return this.bag.splice(i,1)[0];
  }
  remaining(){return this.bag.length;}
  reset(items?:T[]){
    if(items)this.original=items.slice();
    this.bag=this.original.slice();
    this.n=0;
  }
}
