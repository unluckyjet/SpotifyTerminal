export type SessionSnapshot={tracks:number;seconds:number;skips:number;startedAt:number};
type Sample={id:string;playing:boolean;position:number;duration:number};
const clampDt=(s:number)=>Math.min(5,Math.max(0,s));
const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
const noun=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`;

export class SessionStats {
  private tracks=0;
  private seconds=0;
  private skips=0;
  private startedAt:number;
  private last?:Sample;
  private at?:number;
  constructor(now=Date.now()){this.startedAt=now;}
  observe(track:Sample,now=Date.now()){
    if(this.last&&this.at!==undefined){
      if(this.last.playing)this.seconds+=clampDt((now-this.at)/1000);
      const changed=track.id!==this.last.id;
      if(changed)this.tracks++;
      if(this.last.playing){
        if(changed){if(this.last.duration>0&&this.last.position/this.last.duration<0.5)this.skips++;}
        else if(track.position<this.last.position)this.skips++;
      }
    }else this.tracks++;
    this.last={id:track.id,playing:track.playing,position:track.position,duration:track.duration};
    this.at=now;
  }
  snapshot(now=Date.now()):SessionSnapshot{
    let seconds=this.seconds;
    if(this.last?.playing&&this.at!==undefined)seconds+=clampDt((now-this.at)/1000);
    return {tracks:this.tracks,seconds:Math.floor(seconds),skips:this.skips,startedAt:this.startedAt};
  }
  format(now=Date.now()){
    const {tracks,seconds,skips}=this.snapshot(now);
    return `${noun(tracks,'track')} · ${clock(seconds)} · ${noun(skips,'skip')}`;
  }
}
