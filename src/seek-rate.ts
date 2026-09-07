export function seekRate(holdMs:number):number{
  return holdMs<400?10:holdMs<1200?20:30;
}
