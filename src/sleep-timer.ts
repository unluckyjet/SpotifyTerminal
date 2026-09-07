export class SleepTimer {
  private deadline?:number;
  start(minutes:number,now=Date.now()){
    if(!Number.isFinite(minutes)||minutes<1||minutes>180)throw new Error('Choose 1–180 minutes');
    this.deadline=now+minutes*60_000;
  }
  cancel(){this.deadline=undefined;}
  remaining(now=Date.now()){return this.deadline===undefined?undefined:Math.max(0,Math.ceil((this.deadline-now)/1000));}
  expired(now=Date.now()){
    if(this.deadline===undefined||now<this.deadline)return false;
    this.deadline=undefined;return true;
  }
  label(now=Date.now()){
    const s=this.remaining(now);
    if(s===undefined)return '';
    return `Sleep ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  }
}
