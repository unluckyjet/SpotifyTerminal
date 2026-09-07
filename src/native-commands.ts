import type {Command} from './spotify';
type SimpleCommand=Command|'quit'|'mini'|'hide-mini';
export type NativeCommand = {[C in SimpleCommand]:{command:C}}[SimpleCommand] | {command:'seek';position:number};
const allowed=new Set(['play','pause','toggle','next','previous','shuffle','forward','back','louder','quieter','quit','mini','hide-mini']);
export function nativeCommand(value:unknown):NativeCommand|null {
  if(!value||typeof value!=='object')return null;
  const record=value as Record<string,unknown>;
  if(typeof record.command!=='string')return null;
  if(record.command==='seek')return typeof record.position==='number'&&Number.isFinite(record.position)&&record.position>=0?{command:'seek',position:record.position}:null;
  return allowed.has(record.command)?{command:record.command as Command|'quit'|'mini'|'hide-mini'}:null;
}
