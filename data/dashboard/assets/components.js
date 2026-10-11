/* global URL, Blob */
(() => {
  const root = document.querySelector('[data-component-analysis]');
  if (!root) return;
  const rows = JSON.parse(document.getElementById('component-analysis-data').textContent);
  const $ = (selector) => root.querySelector(selector);
  const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  const fmt = (v) => Number.isFinite(v) ? `${v.toFixed(1)} j` : '—';
  const selected = new Set(); let selecting = false; let sort = 0; let descending = false;
  const controls = ['repository','name','auditStatus','conformity','version','open'];
  for (const field of controls.filter((f) => f !== 'open')) {
    const values = [...new Set(rows.map((row) => row[field]).filter(Boolean))].sort((a,b) => a.localeCompare(b,'fr'));
    for (const value of values) { const option = document.createElement('option'); option.value = value; option.textContent = value; $(`[data-component-filter="${field}"]`).append(option); }
  }
  const columns = [...root.querySelectorAll('[data-component-column]')];
  const percentile = (xs,p) => { if (!xs.length) return null; const sorted = [...xs].sort((a,b)=>a-b); const n=(sorted.length-1)*p; return sorted[Math.floor(n)]+(sorted[Math.ceil(n)]-sorted[Math.floor(n)])*(n-Math.floor(n)); };
  const age = (item) => Math.max(0,(Date.now()-Date.parse(item.createdAt))/86400000);
  function render() {
    const query = $('[data-component-search]').value.toLocaleLowerCase('fr');
    const visible = rows.filter((row) => controls.every((field) => { const value=$(`[data-component-filter="${field}"]`).value; return !value || (field === 'open' ? (value === 'yes') === row.items.some((item) => item.open) : row[field] === value); }) && (!query || `${row.repository} ${row.name}`.toLocaleLowerCase('fr').includes(query))).map((row) => {
      const oldest = row.items.filter((item)=>item.open).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))[0];
      const delays = row.items.filter((item)=>item.delay !== null).map((item)=>item.delay);
      const prs = new Set(row.items.flatMap((item)=>item.prs));
      return {row, oldest, values:[row.repository,row.name,row.items.length,row.items.filter((i)=>i.open).length,row.items.filter((i)=>i.treated).length,row.items.filter((i)=>i.cancelled).length,prs.size,row.audits,`${row.version} ${row.auditStatus}`.trim(),row.conformity,oldest ? `#${oldest.number}` : '—',oldest ? fmt(age(oldest)) : '—',delays.length ? fmt(delays.reduce((a,b)=>a+b,0)/delays.length) : '—']};
    }).filter(({values})=>columns.every((input,i)=>!input.value || String(values[i]).toLocaleLowerCase('fr').includes(input.value.toLocaleLowerCase('fr'))));
    visible.sort((a,b)=>{const x=a.values[sort],y=b.values[sort]; const nx=parseFloat(x),ny=parseFloat(y); const cmp=Number.isFinite(nx)&&Number.isFinite(ny)?nx-ny:String(x).localeCompare(String(y),'fr',{numeric:true}); return descending?-cmp:cmp;});
    const chosen = visible.filter(({row})=>!selecting || selected.has(row.id));
    const uniqueIssues = new Map(chosen.flatMap(({row})=>row.items.map((item)=>[item.id,item])));
    const items = [...uniqueIssues.values()];
    for (const [kind,values] of Object.entries({global:items.filter((i)=>i.delay !== null),done:items.filter((i)=>i.delay !== null&&i.source==='done'),estimated:items.filter((i)=>i.delay !== null&&i.source==='estimated')})) {
      const delays=values.map((i)=>i.delay);
      for (const [stat,value] of Object.entries({average:delays.length?delays.reduce((a,b)=>a+b,0)/delays.length:null,median:percentile(delays,.5),p90:percentile(delays,.9)})) $(`[data-component-kpi="${kind}-${stat}"]`).textContent=fmt(value);
      $(`[data-component-count="${kind}"]`).textContent=`${values.length} issue(s) distincte(s)`;
    }
    $('[data-component-summary]').textContent=`${visible.length} composants · ${items.length} issues distinctes`;
    $('[data-component-all]').checked=visible.length>0&&visible.every(({row})=>selected.has(row.id));
    $('[data-component-rows]').innerHTML=visible.map(({row,oldest,values})=>`<tr><td><input type="checkbox" data-component-check="${escape(row.id)}" aria-label="Sélectionner ${escape(row.name)}" ${selected.has(row.id)?'checked':''}></td>${values.map((value,i)=>`<td>${i===10&&oldest&&/^https:\/\/[^\s]+$/.test(oldest.url)?`<a href="${escape(oldest.url)}" target="_blank" rel="noopener noreferrer">${escape(value)} ↗</a>`:escape(value)}</td>`).join('')}</tr>`).join('');
    return visible;
  }
  root.querySelectorAll('select,input[data-component-search],input[data-component-column]').forEach((control)=>control.addEventListener('input',render));
  root.querySelectorAll('[data-component-sort]').forEach((button)=>button.addEventListener('click',()=>{const next=Number(button.dataset.componentSort);descending=next===sort?!descending:false;sort=next;render();}));
  $('[data-component-rows]').addEventListener('change',(event)=>{const id=event.target.dataset.componentCheck;if(!id)return;if(event.target.checked){selected.add(id);}else{selected.delete(id);}selecting=true;render();});
  $('[data-component-all]').addEventListener('change',(event)=>{for(const {row} of render())if(event.target.checked){selected.add(row.id);}else{selected.delete(row.id);}selecting=true;render();});
  $('[data-component-clear]').addEventListener('click',()=>{selected.clear();selecting=false;render();});
  $('[data-component-reset]').addEventListener('click',()=>{root.querySelectorAll('select,input[data-component-search],input[data-component-column]').forEach((c)=>{c.value='';});sort=0;descending=false;render();});
  $('[data-component-export]').addEventListener('click',()=>{const records=render();const header=['Repository','Composant','Issues','Ouvertes','Traitées','Annulées','PR','Audits','Dernier audit','Conformité','Plus ancienne ouverte','Ancienneté maximale','Délai moyen'];const csv='\ufeff'+[header,...records.map((x)=>x.values)].map((r)=>r.map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='analyse-composants.csv';a.click();URL.revokeObjectURL(url);});
  render();
})();
