export function encodeJsonl(row:unknown):string{
  try{const json=JSON.stringify(row);return json===undefined?'':`${json}\n`;}catch{return '';}
}

export function parseJsonl<T>(text:string):T[]{
  const rows:T[]=[];
  for(const line of text.split(/\r\n|\n|\r/)){
    const raw=line.trim();
    if(!raw)continue;
    try{rows.push(JSON.parse(raw) as T);}catch{}
  }
  return rows;
}
