export class FocusTimer {
  private deadline?:number;
  start(minutes:number,now=Date.now()){
    if(!Number.isFinite(minutes)||minutes<0.1||minutes>1440)throw new Error('Choose 0.1–1440 minutes');
    this.deadline=now+minutes*60_000;
  }
  cancel(){this.deadline=undefined;}
  remaining(now=Date.now()){return this.deadline===undefined?undefined:Math.max(0,Math.ceil((this.deadline-now)/1000));}
  expired(now=Date.now()){
    if(this.deadline===undefined||now<this.deadline)return false;
    this.deadline=undefined;return true;
  }
}
