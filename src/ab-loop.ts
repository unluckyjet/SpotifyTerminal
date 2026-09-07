const clock=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s))%60).padStart(2,'0')}`;
export class ABLoop {
  a?:number;
  b?:number;
  setA(position:number){this.a=position;if(this.b!==undefined&&this.a>this.b)[this.a,this.b]=[this.b,this.a];}
  setB(position:number){this.b=position;if(this.a!==undefined&&this.a>this.b)[this.a,this.b]=[this.b,this.a];}
  clear(){this.a=undefined;this.b=undefined;}
  active(){return Number.isFinite(this.a)&&Number.isFinite(this.b)&&this.a!<this.b!;}
  wrap(position:number){return this.active()&&position>=this.b!?this.a!:position;}
  label(){
    const a=Number.isFinite(this.a)?clock(this.a!):'';
    const b=Number.isFinite(this.b)?clock(this.b!):'';
    return a||b?`A ${a}–${b}`:'A —';
  }
}
