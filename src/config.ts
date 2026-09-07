import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export type AppConfig={transitions?:boolean;fullscreen?:boolean;overlay?:boolean;menubar?:boolean;systemMedia?:boolean;vim?:boolean;night?:boolean;repeat?:'off'|'context'|'track';volume?:number};
const flags=['transitions','fullscreen','overlay','menubar','systemMedia','vim','night'] as const;
export const defaultConfig:AppConfig={transitions:false,fullscreen:false,overlay:true,menubar:true,systemMedia:false,vim:false,night:false,repeat:'off',volume:50};
function pick(value:unknown):AppConfig{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const raw=value as Record<string,unknown>;
  const config:AppConfig={};
  for(const key of flags)if(typeof raw[key]==='boolean')config[key]=raw[key];
  if(raw.repeat==='off'||raw.repeat==='context'||raw.repeat==='track')config.repeat=raw.repeat;
  if(typeof raw.volume==='number'&&Number.isInteger(raw.volume)&&raw.volume>=0&&raw.volume<=100)config.volume=raw.volume;
  return config;
}
export function parseConfig(raw:string):AppConfig{
  try{return pick(JSON.parse(raw));}catch{return {};}
}
export function mergeConfig(base:AppConfig,over:AppConfig):AppConfig{
  const next:AppConfig={...base};
  for(const key of [...flags,'repeat','volume'] as const)if(over[key]!==undefined)next[key]=over[key] as never;
  return next;
}
export class ConfigFile {
  constructor(readonly directory:string){}
  async load(){
    try{return mergeConfig(defaultConfig,parseConfig(await readFile(join(this.directory,'config.json'),'utf8')));}
    catch{return {...defaultConfig};}
  }
  async save(config:AppConfig){
    await mkdir(this.directory,{recursive:true});
    const snapshot=JSON.stringify(mergeConfig(defaultConfig,pick(config)),null,2);
    const temp=join(this.directory,`config-${process.pid}.tmp`);
    await writeFile(temp,snapshot);await rename(temp,join(this.directory,'config.json'));
  }
}
