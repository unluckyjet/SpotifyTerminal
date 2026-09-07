export class MuteState {
  muted=false;
  previous=0;
  constructor(volume?:number){if(volume!==undefined&&volume>0)this.previous=volume;}
  toggle(volume:number){
    if(this.muted){this.muted=false;return {muted:false,volume:this.previous};}
    if(volume>0)this.previous=volume;
    this.muted=true;
    return {muted:true,volume:0};
  }
  apply(volume:number){return this.muted?0:volume;}
}
