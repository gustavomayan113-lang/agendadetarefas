const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let tasks=[], theme='dark';
try{tasks=JSON.parse(localStorage.getItem('licit_tasks')||'[]')}catch(e){tasks=[]}
try{theme=localStorage.getItem('licit_theme')||'dark'}catch(e){}
document.documentElement.setAttribute('data-theme',theme);
$('theme').textContent=theme==='dark'?'☀️':'🌙';
try{$('me').value=localStorage.getItem('licit_me')||''}catch(e){}
$('me').addEventListener('input',()=>{try{localStorage.setItem('licit_me',$('me').value)}catch(e){}});
function save(){try{localStorage.setItem('licit_tasks',JSON.stringify(tasks))}catch(e){}}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
$('theme').onclick=()=>{theme=theme==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',theme);$('theme').textContent=theme==='dark'?'☀️':'🌙';try{localStorage.setItem('licit_theme',theme)}catch(e){}};
function uid(){return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
$('f').addEventListener('submit',e=>{
  e.preventDefault();
  const title=$('title').value.trim(); if(!title) return;
  const who=$('who2').value.trim()||$('me').value.trim();
  tasks.push({id:uid(),title,who,date:$('date').value,time:$('time').value,status:'todo',created:Date.now()});
  save(); render(); toast('Adicionada'); e.target.reset();
});
function setStatus(id,status){const t=tasks.find(x=>x.id===id);if(t){t.status=status;save();render()}}
function removeTask(id){if(!confirm('Apagar?'))return;tasks=tasks.filter(t=>t.id!==id);save();render()}
function card(t){
  const div=document.createElement('div'); div.className='card'; div.draggable=true; div.dataset.id=t.id;
  div.innerHTML=`<div class="ctitle">${t.title}</div>
    <div class="cmeta">📅 ${t.date} ${t.time||''}</div>
    <div class="cmeta">👤 ${t.who||'—'}</div>
    <div class="btns">
      <button onclick="setStatus('${t.id}','todo')">A fazer</button>
      <button onclick="setStatus('${t.id}','doing')">Andamento</button>
      <button onclick="setStatus('${t.id}','done')">Concluída</button>
      <button onclick="setStatus('${t.id}','cancelada')">Cancelada</button>
      <button onclick="setStatus('${t.id}','perdida')">Perdida</button>
    </div>
    <button class="x" onclick="removeTask('${t.id}')">✕</button>`;
  div.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',t.id)});
  return div;
}
function render(){
  ['todo','doing','done','cancelada','perdida'].forEach(s=>{
    const col=document.getElementById('col'+s.charAt(0).toUpperCase()+s.slice(1));
    col.innerHTML='';
    tasks.filter(t=>t.status===s).forEach(t=>col.appendChild(card(t)));
  });
  $('cTodo').textContent=tasks.filter(t=>t.status==='todo').length;
  $('cDoing').textContent=tasks.filter(t=>t.status==='doing').length;
  $('cDone').textContent=tasks.filter(t=>t.status==='done').length;
  $('cCancelada').textContent=tasks.filter(t=>t.status==='cancelada').length;
  $('cPerdida').textContent=tasks.filter(t=>t.status==='perdida').length;
}
document.querySelectorAll('.cards').forEach(col=>{
  col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('over')});
  col.addEventListener('dragleave',()=>col.classList.remove('over'));
  col.addEventListener('drop',e=>{
    e.preventDefault();col.classList.remove('over');
    const id=e.dataTransfer.getData('text/plain');
    const t=tasks.find(x=>x.id===id);
    if(t){t.status=col.parentElement.dataset.status;save();render()}
  });
});
render();
