import type {Command} from './spotify';
export type NativeCommand = {command:Command|'quit'} | {command:'seek';position:number};
const allowed=new Set(['play','pause','toggle','next','previous','shuffle','forward','back','louder','quieter','quit']);
export function nativeCommand(value:unknown):NativeCommand|null {
  if(!value||typeof value!=='object')return null;
  const record=value as Record<string,unknown>;
  if(typeof record.command!=='string')return null;
  if(record.command==='seek')return typeof record.position==='number'&&Number.isFinite(record.position)&&record.position>=0?{command:'seek',position:record.position}:null;
  return allowed.has(record.command)?{command:record.command as Command|'quit'}:null;
}
