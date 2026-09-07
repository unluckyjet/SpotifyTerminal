const vimKeys={
  h:'previous',
  j:'back',
  k:'forward',
  l:'next',
  ' ':'toggle',
  space:'toggle',
  '0':'replay',
} as const;
export function vimCommand(key:string):typeof vimKeys[keyof typeof vimKeys]|undefined{
  return vimKeys[key.toLowerCase() as keyof typeof vimKeys];
}
