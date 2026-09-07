import {parseDuration} from './parse-duration';
export type IpcCommand={action:string;arg?:string|number};

const BARE=new Set(['play','pause','toggle','next','previous','shuffle','forward','back','louder','quieter','mute','quit']);
const REPEAT=new Set(['off','context','track']);

export function parseIpc(line:string):IpcCommand|null{
  const raw=line.trim();
  if(!raw)return null;
  const [action,...rest]=raw.split(/\s+/);
  if(BARE.has(action))return rest.length?null:{action};
  if(rest.length!==1)return null;
  const token=rest[0];
  if(action==='seek'){
    if(/^\d+(\.\d+)?$/.test(token)){
      const arg=Number(token);
      return Number.isFinite(arg)?{action,arg}:null;
    }
    const clock=parseDuration(token);
    return clock===undefined?null:{action,arg:clock};
  }
  if(action==='volume'){
    if(!/^\d+$/.test(token))return null;
    const arg=Number(token);
    return Number.isInteger(arg)&&arg>=0&&arg<=100?{action,arg}:null;
  }
  if(action==='repeat'&&REPEAT.has(token))return {action,arg:token};
  return null;
}
