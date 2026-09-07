export type LayoutMode='full'|'compact'|'tiny';
export function layoutMode(width:number,height:number):LayoutMode{
  if(width<32||height<16)return 'tiny';
  if(width<60||height<20)return 'compact';
  return 'full';
}
