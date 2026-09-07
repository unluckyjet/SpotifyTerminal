import {test,expect} from 'bun:test';
import {csvEscape,csvRow} from './csv';

function parseCsv(text:string){
  const rows:string[][]=[];let row:string[]=[],field='',i=0,quoted=false;
  const push=()=>{row.push(field);field='';};
  while(i<text.length){
    const c=text[i];
    if(quoted){
      if(c==='"'&&text[i+1]==='"'){field+='"';i+=2;continue;}
      if(c==='"'){quoted=false;i++;continue;}
      field+=c;i++;continue;
    }
    if(c==='"'){quoted=true;i++;continue;}
    if(c===','){push();i++;continue;}
    if(c==='\r'&&text[i+1]==='\n'){push();rows.push(row);row=[];i+=2;continue;}
    if(c==='\n'||c==='\r'){push();rows.push(row);row=[];i++;continue;}
    field+=c;i++;
  }
  if(quoted)throw new Error('unterminated quote');
  if(field.length||row.length){push();rows.push(row);}
  return rows;
}

const special=/"|\r|\n|,/;

test('csvEscape and csvRow follow RFC4180: quote comma/CR/LF/quote, double inner quotes',()=>{
  const fields=[
    '','a','abc','Artist','id','name with spaces',' leading','trailing ',
    'He said "hi"','A, B','t,1','Line\nbreak','cr\ronly','crlf\r\nmix',
    '"','""','a"b"c','"quoted"','comma,and"quote','a\nb,c"d',
    'tab\there','semi;colon','café','🎵','spotify:track:xyz',
    'aaa','b"bb','ccc','b\r\nbb',
  ];
  for(const value of fields){
    const escaped=csvEscape(value);
    const needsQuote=special.test(value);
    if(needsQuote){
      expect(escaped.startsWith('"')).toBe(true);
      expect(escaped.endsWith('"')).toBe(true);
      expect(escaped.slice(1,-1)).toBe(value.replaceAll('"','""'));
      expect(escaped.includes(value.replaceAll('"','""'))).toBe(true);
    }else{
      expect(escaped).toBe(value);
    }
    expect(csvRow([value])).toBe(escaped);
    if(value!=='')expect(parseCsv(escaped)).toEqual([[value]]);
  }

  expect(csvRow([])).toBe('');
  expect(csvRow([''])).toBe(csvEscape(''));
  const emptyPair=csvRow(['','']);
  expect(parseCsv(emptyPair)).toEqual([['','']]);
  expect(csvRow(['a','b']).endsWith(',')).toBe(false);

  const row=['id','He said "hi"','A, B','Line\nbreak','t,1'];
  const encoded=csvRow(row);
  expect(encoded).toBe(row.map(csvEscape).join(','));
  expect(encoded.includes(',')).toBe(true);
  expect(parseCsv(encoded)).toEqual([row]);
  expect(encoded).toContain(csvEscape('He said "hi"'));
  expect(encoded).toContain(csvEscape('A, B'));
  expect(encoded).toContain(csvEscape('Line\nbreak'));

  const rfc=[
    ['aaa','bbb','ccc'],
    ['aaa','b\r\nbb','ccc'],
    ['aaa','b"bb','ccc'],
    ['zzz','yyy','xxx'],
  ];
  for(const values of rfc)expect(parseCsv(csvRow(values))).toEqual([values]);
  expect(csvRow(['aaa','b"bb','ccc'])).toBe(['aaa','b"bb','ccc'].map(csvEscape).join(','));
  expect(csvEscape('b"bb')).toBe(`"${'b"bb'.replaceAll('"','""')}"`);
  expect(csvEscape('b\r\nbb').includes('\r\n')).toBe(true);

  const table=rfc.map(csvRow).join('\r\n');
  expect(table).toContain('\r\n');
  expect(parseCsv(table)).toEqual(rfc);

  const history=[
    {id:'abc',name:'Song',artist:'Artist',album:'Album',playedAt:'2024-01-01T00:00:00.000Z'},
    {id:'spotify:track:xyz',name:'He said "hi"',artist:'A, B',album:'Line\nbreak',playedAt:'t,1'},
  ];
  const header=['id','name','artist','album','playedAt'];
  const csv=[csvRow(header),...history.map(e=>csvRow(header.map(k=>e[k as keyof typeof e])))].join('\r\n');
  const parsed=parseCsv(csv);
  expect(parsed[0]).toEqual(header);
  expect(parsed.slice(1)).toEqual(history.map(e=>header.map(k=>e[k as keyof typeof e])));
});
