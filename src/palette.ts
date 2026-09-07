export type PaletteCommand={id:string;label:string;keywords?:string;run:()=>void|Promise<void>};
export class CommandPalette {
  query='';selected=0;
  constructor(readonly commands:PaletteCommand[]){}
  get matches(){const words=this.query.toLowerCase().trim().split(/\s+/).filter(Boolean);return this.commands.filter(c=>words.every(w=>(c.label+' '+(c.keywords??'')).toLowerCase().includes(w)));}
  edit(text:string){this.query=text;this.selected=0;}
  move(delta:number){const n=this.matches.length;this.selected=n?(this.selected+delta+n)%n:0;}
  choose(){return this.matches[this.selected];}
  view(limit=8){const matches=this.matches,start=Math.max(0,this.selected-limit+1);return {lines:matches.slice(start,start+limit).map(c=>c.label),selected:this.selected-start};}
}
