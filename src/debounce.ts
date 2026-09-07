export class CommandDebounce {
  private last=new Map<string,number>();
  constructor(private ms=120){}
  allow(command:string,now=Date.now()){
    const prev=this.last.get(command);
    if(prev!==undefined&&now-prev<this.ms)return false;
    this.last.set(command,now);
    return true;
  }
  reset(){this.last.clear();}
}
