export type KeyAction=string;
export class Keymap {
  map:Record<string,KeyAction>;
  constructor(entries?:Record<string,KeyAction>){this.map={...entries};}
  bind(key:string,action:KeyAction){this.map[key]=action;}
  lookup(key:string){return Object.hasOwn(this.map,key)?this.map[key]:undefined;}
  parse(text:string){
    for(const raw of text.split(/\r?\n/)){
      const line=raw.replace(/#.*$/,'').trim();
      if(!line)continue;
      const i=line.search(/\s+/);
      if(i<0)continue;
      this.bind(line.slice(0,i),line.slice(i).trim());
    }
  }
  serialize(){return Object.entries(this.map).map(([key,action])=>`${key} ${action}`).join('\n');}
}
