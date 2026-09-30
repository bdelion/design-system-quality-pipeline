import { createHash } from 'node:crypto';
export function stableHash(seed:string,value:string):string { return createHash('sha256').update(`${seed}\0${value}`).digest('hex'); }
export function stableToken(seed:string,value:string,prefix:string,length=8):string { return `${prefix}-${stableHash(seed,value).slice(0,length)}`; }
export function createStableMapper(seed:string) { const cache=new Map<string,string>(); return (namespace:string,source:string,prefix:string):string => { const key=`${namespace}:${source}`; const existing=cache.get(key); if(existing) return existing; const mapped=stableToken(seed,key,prefix); cache.set(key,mapped); return mapped; }; }
