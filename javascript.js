const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
let tasks=[], theme='dark', filter='all';
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
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');filter=b.dataset.f;render();
}));
function render(){
  const list=$('list'); list.innerHTML='';
  let ts=[...tasks];
  if(filter!=='all') ts=ts.filter(t=>t.status===filter);
  ts.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||''));
  if(!ts.length){list.innerHTML='<div class="empty">Nenhuma tarefa.</div>';return}
  ts.forEach(t=>{
    const row=document.createElement('div'); row.className='task '+t.status;
    row.innerHTML=`<div class="body"><div class="t">${t.title}</div><div class="meta"><span>📅 ${t.date} ${t.time||''}</span><span>👤 ${t.who||'—'}</span></div></div>
      <button class="st" onclick="setStatus('${t.id}','todo')">A fazer</button>
      <button class="st" onclick="setStatus('${t.id}','doing')">Em andamento</button>
      <button class="st" onclick="setStatus('${t.id}','done')">Concluída</button>
      <button class="x" onclick="removeTask('${t.id}')">✕</button>`;
    list.appendChild(row);
  });
}
render();
EOF
echo done