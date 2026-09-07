export type PomodoroPhase='work'|'break'|'long-break'|'idle';
const DUR={work:25*60_000,break:5*60_000,'long-break':15*60_000} as const;
export class Pomodoro {
  phase:PomodoroPhase='idle';
  completed=0;
  private deadline?:number;
  start(now=Date.now()){
    this.completed=0;
    this.begin('work',now);
  }
  tick(now=Date.now()):PomodoroPhase{
    if(this.phase==='idle'||this.deadline===undefined||now<this.deadline)return this.phase;
    if(this.phase==='work'){
      this.completed++;
      this.begin(this.completed%4===0?'long-break':'break',now);
    }else this.begin('work',now);
    return this.phase;
  }
  cancel(){this.phase='idle';this.deadline=undefined;}
  remaining(now=Date.now()){return this.deadline===undefined?undefined:Math.max(0,Math.ceil((this.deadline-now)/1000));}
  label(now=Date.now()){
    const s=this.remaining(now);
    if(s===undefined)return '';
    return `${this.phase} ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  }
  private begin(phase:Exclude<PomodoroPhase,'idle'>,now:number){
    this.phase=phase;
    this.deadline=now+DUR[phase];
  }
}
