export type RepeatMode='off'|'context'|'track';
export const REPEAT_ORDER:RepeatMode[]=['off','context','track'];
export function cycleRepeat(mode:RepeatMode):RepeatMode{
  const i=REPEAT_ORDER.indexOf(mode);
  return REPEAT_ORDER[(i<0?0:i+1)%REPEAT_ORDER.length];
}
export function formatRepeatBadge(mode:RepeatMode){
  return mode==='off'?'':mode==='track'?'repeat one':'repeat';
}
export function repeatScript(mode:RepeatMode){
  // Spotify AppleScript only exposes a boolean repeating flag; badges distinguish context vs track.
  return mode==='off'?'set repeating to false':'set repeating to true';
}
export function parseRepeatFlag(value:string|undefined):RepeatMode{
  if(value===undefined)return 'off';
  const mode=value.trim().toLowerCase();
  if((REPEAT_ORDER as readonly string[]).includes(mode))return mode as RepeatMode;
  throw new Error(`Unknown repeat mode: ${value}`);
}
