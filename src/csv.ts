export function csvEscape(value:string):string{
  return /["\r\n,]/.test(value)?`"${value.replaceAll('"','""')}"`:value;
}
export function csvRow(values:string[]):string{
  return values.map(csvEscape).join(',');
}
