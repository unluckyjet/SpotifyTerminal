export function notifyPayload(track:{name:string;artist:string;album:string}){
  return {title:track.name,subtitle:track.artist,body:track.album};
}
export function appleScriptString(value:string){
  return value.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\r\n\u0000]+/g,' ');
}
export function notifyArgs(payload:{title:string;subtitle:string;body:string}):[string,string,string]{
  const title=appleScriptString(payload.title);
  const subtitle=appleScriptString(payload.subtitle);
  const body=appleScriptString(payload.body);
  return ['osascript','-e',`display notification "${body}" with title "${title}" subtitle "${subtitle}"`];
}
