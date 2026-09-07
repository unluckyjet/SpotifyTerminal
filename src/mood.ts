export function coverMood(pixels:Buffer):'dark'|'warm'|'cool'|'bright'|'muted'{
  let r=0,g=0,b=0,n=0;
  for(let i=0;i+2<pixels.length;i+=3){
    r+=pixels[i];g+=pixels[i+1];b+=pixels[i+2];n++;
  }
  if(!n)return 'muted';
  r/=n;g/=n;b/=n;
  const luma=(2126*r+7152*g+722*b)/10000;
  if(luma<40)return 'dark';
  if(luma>200)return 'bright';
  if(r>g+10&&r>b)return 'warm';
  if(b>r+10)return 'cool';
  return 'muted';
}
