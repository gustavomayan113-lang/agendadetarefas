const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let licitacoes=[], tasks=[], theme='dark';
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

$('fLic').addEventListener('submit',e=>{
  e.preventDefault();
  const l={id:uid(),title:$('lTitle').value.trim(),orgao:$('lOrgao').value.trim(),numero:$('lNumero').value.trim(),prazo:$('lPrazo').value,hora:$('lHora').value,reqs:{vistoria:$('cVistoria').checked,garantia:$('cGarantia').checked,composicao:$('cComposicao').checked,docs:$('cDocs').checked},exig:$('lExig').value.trim(),resp:$('lResp').value,status:'andamento',created:Date.now()};
  licitacoes.push(l); save(); renderAll(); toast('Edital cadastrado'); e.target.reset();
});

$('fTask').addEventListener('submit',e=>{
  e.preventDefault();
  const t={id:uid(),title:$('tTitle').value.trim(),lic:$('tLic').value,date:$('tDate').value,time:$('tTime').value,resp:$('tResp').value,status:'todo',created:Date.now()};
  tasks.push(t); save(); renderAll(); toast('Tarefa adicionada'); e.target.reset();
});

function removeTask(id){if(!confirm('Apagar?'))return;tasks=tasks.filter(t=>t.id!==id);save();renderAll()}
function removeLic(id){if(!confirm('Apagar edital?'))return;licitacoes=licitacoes.filter(x=>x.id!==id);tasks=tasks.filter(t=>t.lic!==id);save();renderAll()}

function card(t){
  const lic=licitacoes.find(l=>l.id===t.lic);
  const div=document.createElement('div'); div.className='card'; div.draggable=true; div.dataset.id=t.id;
  div.innerHTML=`<div class="ctitle">${t.title}</div>
    <div class="cmeta">📅 ${t.date} ${t.time||''}</div>
    <div class="cmeta">👤 ${t.resp||'—'}</div>
    ${lic?`<div class="cmeta">📋 ${lic.title}</div>`:''}
    <button class="x" onclick="removeTask('${t.id}')">✕</button>`;
  div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',t.id)});
  return div;
}

function renderAll(){
  fillSelects();
  ['todo','doing','done'].forEach(s=>{
    const col=document.getElementById('col'+s.charAt(0).toUpperCase()+s.slice(1));
    col.innerHTML='';
    tasks.filter(t=>t.status===s).forEach(t=>col.appendChild(card(t)));
  });
  $('cTodo').textContent=tasks.filter(t=>t.status==='todo').length;
  $('cDoing').textContent=tasks.filter(t=>t.status==='doing').length;
  $('cDone').textContent=tasks.filter(t=>t.status==='done').length;
}

document.querySelectorAll('.cards').forEach(col=>{
  col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('over')});
  col.addEventListener('dragleave',()=>col.classList.remove('over'));
  col.addEventListener('drop',e=>{
    e.preventDefault();col.classList.remove('over');
    const id=e.dataTransfer.getData('text/plain');
    const t=tasks.find(x=>x.id===id);
    if(t){t.status=col.parentElement.dataset.status;save();renderAll()}
  });
});

$('export').onclick=()=>{
  const blob=new Blob([JSON.stringify({licitacoes,tasks},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='backup.json'; a.click();
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