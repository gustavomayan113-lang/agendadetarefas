const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let licitacoes=[], tasks=[], theme='dark', filterTask='all', filterLic='all', searchLic='';
try{licitacoes=JSON.parse(localStorage.getItem('licit_lic')||'[]')}catch(e){licitacoes=[]}
try{tasks=JSON.parse(localStorage.getItem('licit_tasks')||'[]')}catch(e){tasks=[]}
try{theme=localStorage.getItem('licit_theme')||'dark'}catch(e){}
document.documentElement.setAttribute('data-theme',theme);
$('theme').textContent=theme==='dark'?'☀️':'🌙';
try{$('me').value=localStorage.getItem('licit_me')||''}catch(e){}
$('me').addEventListener('input',()=>{try{localStorage.setItem('licit_me',$('me').value)}catch(e){}});

function save(){try{localStorage.setItem('licit_lic',JSON.stringify(licitacoes));localStorage.setItem('licit_tasks',JSON.stringify(tasks))}catch(e){}}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
$('theme').onclick=()=>{theme=theme==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',theme);$('theme').textContent=theme==='dark'?'☀️':'🌙';try{localStorage.setItem('licit_theme',theme)}catch(e){}};

function uid(){return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function people(){
  const set=new Set();
  if($('me').value.trim()) set.add($('me').value.trim());
  licitacoes.forEach(l=>{if(l.resp) set.add(l.resp)});
  tasks.forEach(t=>{if(t.resp) set.add(t.resp)});
  return [...set];
}
function fillSelects(){
  const ps=people();
  ['lResp','tResp'].forEach(id=>{
    const sel=$(id); const cur=sel.value;
    sel.innerHTML='<option value="">Responsável</option>'+ps.map(p=>`<option>${p}</option>`).join('');
    if(ps.includes(cur)) sel.value=cur;
  });
  const tl=$('tLic'); const cur=tl.value;
  tl.innerHTML='<option value="">Vincular edital (opcional)</option>'+licitacoes.map(l=>`<option value="${l.id}">${l.title}</option>`).join('');
  if(licitacoes.some(l=>l.id===cur)) tl.value=cur;
}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const v=b.dataset.view;
  ['dashboard','licitacoes','agenda','historico'].forEach(n=>$(n+'View').hidden=n!==v);
  renderAll();
}));

$('fLic').addEventListener('submit',e=>{
  e.preventDefault();
  const l={id:uid(),title:$('lTitle').value.trim(),orgao:$('lOrgao').value.trim(),numero:$('lNumero').value.trim(),prazo:$('lPrazo').value,hora:$('lHora').value,reqs:{vistoria:$('cVistoria').checked,garantia:$('cGarantia').checked,composicao:$('cComposicao').checked,docs:$('cDocs').checked},exig:$('lExig').value.trim(),resp:$('lResp').value,status:'andamento',created:Date.now()};
  licitacoes.push(l); save(); renderAll(); toast('Edital cadastrado');
  e.target.reset();
});

$('fTask').addEventListener('submit',e=>{
  e.preventDefault();
  const t={id:uid(),title:$('tTitle').value.trim(),lic:$('tLic').value,date:$('tDate').value,time:$('tTime').value,resp:$('tResp').value,status:'aberta',created:Date.now()};
  tasks.push(t); save(); renderAll(); toast('Tarefa adicionada');
  e.target.reset();
});

function setStatus(id,status){const l=licitacoes.find(x=>x.id===id);if(l){l.status=status;save();renderAll();toast('Status atualizado')}}
function removeLic(id){if(!confirm('Apagar edital?'))return;licitacoes=licitacoes.filter(x=>x.id!==id);tasks=tasks.filter(t=>t.lic!==id);save();renderAll();toast('Removido')}
function toggleTask(id){const t=tasks.find(x=>x.id===id);if(t){t.status=t.status==='feita'?'aberta':'feita';save();renderAll()}}

function renderDashboard(){
  $('stTotal').textContent=licitacoes.length;
  $('stAndamento').textContent=licitacoes.filter(l=>l.status==='andamento').length;
  $('stGanhas').textContent=licitacoes.filter(l=>l.status==='ganha').length;
  $('stPerdidas').textContent=licitacoes.filter(l=>l.status==='perdida').length;
  $('stNao').textContent=licitacoes.filter(l=>l.status==='nao').length;
  $('stTarefas').textContent=tasks.filter(t=>t.status==='aberta').length;
  const alerts=$('alerts'); alerts.innerHTML='';
  const now=new Date();
  const soon=licitacoes.filter(l=>l.status==='andamento').map(l=>({...l,days:Math.ceil((new Date(l.prazo+'T'+(l.hora||'00:00'))-now)/86400000)})).filter(l=>l.days<=7).sort((a,b)=>a.days-b.days);
  soon.forEach(l=>{
    const d=document.createElement('div'); d.className='task'; d.style.borderLeftColor=l.days<0?'var(--todo)':'var(--doing)';
    d.innerHTML=`<div class="body"><div class="t">${l.title}</div><div class="meta"><span>⏰ ${l.days<0?'Atrasado':l.days+' dia(s) restante(s)'}</span><span>📅 ${l.prazo} ${l.hora||''}</span></div></div>`;
    alerts.appendChild(d);
  });
  if(!soon.length) alerts.innerHTML='<div class="empty">Nenhum alerta próximo.</div>';
}

function renderLicitacoes(){
  const list=$('licList'); list.innerHTML='';
  let ls=[...licitacoes];
  if(filterLic!=='all') ls=ls.filter(l=>l.status===filterLic);
  if(searchLic) ls=ls.filter(l=>(l.title+' '+l.orgao+' '+l.numero).toLowerCase().includes(searchLic.toLowerCase()));
  ls.sort((a,b)=>(a.prazo||'').localeCompare(b.prazo||''));
  if(!ls.length){list.innerHTML='<div class="empty">Nenhum edital.</div>';return}
  ls.forEach(l=>{
    const row=document.createElement('div'); row.className='task';
    const reqs=Object.entries(l.reqs).filter(([,v])=>v).map(([k])=>k).join(', ')||'—';
    row.innerHTML=`<div class="body">
      <div class="t">${l.title}</div>
      <div class="meta"><span>🏛 ${l.orgao||'—'}</span><span>#${l.numero||'—'}</span><span>📅 ${l.prazo} ${l.hora||''}</span><span>👤 ${l.resp||'—'}</span><span>📌 ${reqs}</span></div>
      ${l.exig?`<div class="meta" style="margin-top:4px">${l.exig}</div>`:''}
    </div>
    <select class="st" onchange="setStatus('${l.id}',this.value)">
      <option value="andamento" ${l.status==='andamento'?'selected':''}>Em andamento</option>
      <option value="ganha" ${l.status==='ganha'?'selected':''}>Ganha</option>
      <option value="perdida" ${l.status==='perdida'?'selected':''}>Perdida</option>
      <option value="nao" ${l.status==='nao'?'selected':''}>Não participou</option>
    </select>
    <button class="x" onclick="removeLic('${l.id}')">✕</button>`;
    list.appendChild(row);
  });
}

function renderAgenda(){
  const list=$('taskList'); list.innerHTML='';
  let ts=[...tasks];
  if(filterTask==='aberta') ts=ts.filter(t=>t.status==='aberta');
  if(filterTask==='feita') ts=ts.filter(t=>t.status==='feita');
  ts.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||''));
  if(!ts.length){list.innerHTML='<div class="empty">Nenhuma tarefa.</div>';return}
  ts.forEach(t=>{
    const lic=licitacoes.find(l=>l.id===t.lic);
    const row=document.createElement('div'); row.className='task '+(t.status==='feita'?'done':'todo');
    row.innerHTML=`<div class="body">
      <div class="t">${t.title}</div>
      <div class="meta"><span>📅 ${t.date} ${t.time||''}</span><span>👤 ${t.resp||'—'}</span>${lic?`<span>📋 ${lic.title}</span>`:''}</div>
    </div>
    <button class="st" onclick="toggleTask('${t.id}')">${t.status==='feita'?'Feita ✓':'Abrir'}</button>`;
    list.appendChild(row);
  });
}

function renderHistorico(){
  const list=$('histList'); list.innerHTML='';
  const done=licitacoes.filter(l=>l.status!=='andamento');
  if(!done.length){list.innerHTML='<div class="empty">Sem histórico ainda.</div>';return}
  done.forEach(l=>{
    const row=document.createElement('div'); row.className='task';
    const color=l.status==='ganha'?'var(--done)':l.status==='perdida'?'var(--todo)':'var(--mute)';
    row.style.borderLeftColor=color;
    row.innerHTML=`<div class="body"><div class="t">${l.title}</div><div class="meta"><span>🏛 ${l.orgao||'—'}</span><span>📅 ${l.prazo}</span><span>Resultado: <b>${l.status}</b></span></div></div>`;
    list.appendChild(row);
  });
}

function renderAll(){fillSelects();renderDashboard();renderLicitacoes();renderAgenda();renderHistorico()}

$('searchLic').addEventListener('input',e=>{searchLic=e.target.value;renderLicitacoes()});
$('filterStatus').addEventListener('change',e=>{filterLic=e.target.value;renderLicitacoes()});
document.querySelectorAll('#agendaView .filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#agendaView .filter').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');filterTask=b.dataset.f;renderAgenda();
}));

$('export').onclick=()=>{
  const blob=new Blob([JSON.stringify({licitacoes,tasks},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='licit_backup.json'; a.click();
};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result); if(d.licitacoes) licitacoes=d.licitacoes; if(d.tasks) tasks=d.tasks; save(); renderAll(); toast('Importado')}catch(err){toast('Arquivo inválido')}};
  r.readAsText(f);
});

renderAll();
EOF
echo done