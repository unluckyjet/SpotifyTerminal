export class QuitGuard {
  private armedAt?:number;
  constructor(private windowMs=1500){}
  press(now=Date.now()){
    if(this.armedAt!==undefined&&now-this.armedAt<this.windowMs){
      this.armedAt=undefined;
      return true;
    }
    this.armedAt=now;
    return false;
  }
  reset(){this.armedAt=undefined;}
}
