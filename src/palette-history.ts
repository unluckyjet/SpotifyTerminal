export class PaletteHistory {
  items:string[]=[];
  private index=-1;
  push(query:string){
    const q=query.trim();
    if(!q)return;
    this.items=[q,...this.items.filter(item=>item!==q)].slice(0,20);
    this.index=-1;
  }
  previous(){
    if(this.index>=this.items.length-1)return undefined;
    return this.items[++this.index];
  }
  next(){
    if(this.index<0)return undefined;
    this.index--;
    return this.index<0?undefined:this.items[this.index];
  }
}
