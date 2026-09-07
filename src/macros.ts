export function parseMacro(text:string):string[]{
  return text.split(/[,\s]+/).filter(Boolean);
}

export function expandMacros(map:Record<string,string>,name:string,depth=8):string[]{
  if(!Number.isFinite(depth)||depth<1||!Object.hasOwn(map,name))return [name];
  return parseMacro(map[name]).flatMap(token=>expandMacros(map,token,depth-1));
}
