import {compareSemver} from './semver';
export function parsePackageVersion(json:string):string{
  const version=(JSON.parse(json) as {version?:unknown}).version;
  if(typeof version!=='string')throw new Error('package.json version must be a string');
  return version;
}

export function formatVersion(version:string,name='spotterminal'){
  return `${name} ${version}`;
}
export function versionLine(current:string,latest?:string,name='spotterminal'){
  const base=formatVersion(current,name);
  if(!latest)return base;
  return compareSemver(current,latest)<0?`${base} (update ${latest})`:base;
}
