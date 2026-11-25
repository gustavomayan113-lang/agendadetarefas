const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const NEXT={todo:'doing',doing:'done',done:'todo'};
const LABEL={todo:'A fazer',doing:'Fazendo',done:'Feito'};
const PRIO={todo:'var(--todo)',doing:'var(--doing)',done:'var(--done)'};

let tasks=[],view=new Date(),sel=key(new Date()),filter='all',search='',sort='date',theme='dark';
view.setDate(1);
try{tasks=JSON.parse(localStorage.getItem('agenda_tasks')||'[]')}catch(e){tasks=[]}
try{theme=localStorage.getItem('agenda_theme')||'dark'}catch(e){}
applyTheme(theme);
try{$('me').value=localStorage.getItem('agenda_me')||''}catch(e){}
$('me').addEventListener('input',()=>{try{localStorage.setItem('agenda_me',$('me').value)}catch(e){}});

function save(){try{localStorage.setItem('agenda_tasks',JSON.stringify(tasks))}catch(e){}}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

function applyTheme(t){theme=t;document.documentElement.setAttribute('data-theme',t);$('theme').textContent=t==='dark'?'☀️':'🌙';try{localStorage.setItem('agenda_theme',t)}catch(e){}}

$('theme').onclick=()=>applyTheme(theme==='dark'?'light':'dark');

function uid(){return 't'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

function addTask(data){
  tasks.push({id:uid(),status:'todo',created:Date.now(),...data});
  save();renderAll();toast('Tarefa adicionada');
}

function updateTask(id,patch){tasks=tasks.map(t=>t.id===id?{...t,...patch}:t);save();renderAll()}
function removeTask(id){if(!confirm('Apagar essa tarefa?'))return;tasks=tasks.filter(t=>t.id!==id);save();renderAll();toast('Removida')}

// quick schedule
$('quick').addEventListener('change',e=>{
  const v=e.target.value;if(!v)return;
  const now=new Date();
  if(v==='15'){now.setMinutes(now.getMinutes()+15)}
  else if(v==='60'){now.setHours(now.getHours()+1)}
  else if(v==='today'){}
  else if(v==='tomorrow'){now.setDate(now.getDate()+1)}
  else if(v==='week'){now.setDate(now.getDate()+7)}
  else if(v==='month'){now.setMonth(now.getMonth()+1)}
  $('date').value=key(now);
  if(v!=='today'&&v!=='tomorrow'&&v!=='week'&&v!=='month') $('time').value=pad(now.getHours())+':'+pad(now.getMinutes());
  e.target.value='';
});

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const v=b.dataset.view;
  $('calendarView').hidden=v!=='calendar';
  $('tasksView').hidden=v!=='tasks';
  $('todayView').hidden=v!=='today';
  renderAll();
}));

function renderCalendar(){
  const y=view.getFullYear(),m=view.getMonth();
  $('mtitle').textContent=view.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());
  const box=$('days');box.innerHTML='';
  const today=key(new Date());
  for(let i=0;i<42;i++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i),k=key(d);
    const el=document.createElement('div');
    el.className='day'+(d.getMonth()!==m?' out':'')+(k===today?' today':'')+(k===sel?' sel':'');
    const n=document.createElement('span');n.className='n';n.textContent=d.getDate();el.appendChild(n);
    const ts=tasks.filter(t=>t.date===k);
    if(ts.length){
      const dots=document.createElement('div');dots.className='dots';
      ts.slice(0,6).forEach(t=>{const o=document.createElement('div');o.className='dot '+t.status;dots.appendChild(o)});
      if(ts.length>6){const mo=document.createElement('span');mo.className='more';mo.textContent='+'+(ts.length-6);dots.appendChild(mo)}
      el.appendChild(dots);
    }
    el.onclick=()=>{sel=k;if(d.getMonth()!==m){view=new Date(d.getFullYear(),d.getMonth(),1)}renderAll()};
    box.appendChild(el);
  }
  const [sy,sm,sd]=sel.split('-').map(Number);
  $('dtitle').textContent=new Date(sy,sm-1,sd).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const dayTasks=tasks.filter(t=>t.date===sel).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const list=$('list');list.innerHTML='';
  if(!dayTasks.length){list.innerHTML='<div class="empty">Dia livre. Adicione uma tarefa acima.</div>';return}
  dayTasks.forEach(t=>list.appendChild(taskCard(t)));
  updateStats(dayTasks);
}

function updateStats(ts){
  $('stTodo').textContent=ts.filter(t=>t.status==='todo').length;
  $('stDoing').textContent=ts.filter(t=>t.status==='doing').length;
  $('stDone').textContent=ts.filter(t=>t.status==='done').length;
}

function taskCard(t){
  const row=document.createElement('div');row.className='task '+t.status;
  const b=document.createElement('div');b.className='body';
  const tt=document.createElement('div');tt.className='t';tt.textContent=t.title;
  const mt=document.createElement('div');mt.className='meta';
  if(t.who) mt.innerHTML+='<span>👤 '+escape(t.who)+'</span>';
  if(t.date) mt.innerHTML+='<span>📅 '+t.date+'</span>';
  if(t.time) mt.innerHTML+='<span>🕐 '+t.time+'</span>';
  b.append(tt,mt);
  const st=document.createElement('button');st.className='st';st.textContent=LABEL[t.status];
  st.onclick=()=>updateTask(t.id,{status:NEXT[t.status]});
  const x=document.createElement('button');x.className='x';x.textContent='✕';
  x.onclick=()=>removeTask(t.id);
  row.append(b,st,x);return row;
}
function escape(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}

function renderTasks(){
  const list=$('allList');list.innerHTML='';
  let ts=[...tasks];
  if(filter!=='all') ts=ts.filter(t=>t.status===filter);
  if(search) ts=ts.filter(t=>(t.title+' '+(t.who||'')).toLowerCase().includes(search.toLowerCase()));
  if(sort==='date') ts.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||''));
  else if(sort==='status') ts.sort((a,b)=>a.status.localeCompare(b.status));
  else ts.sort((a,b)=>a.title.localeCompare(b.title));
  if(!ts.length){list.innerHTML='<div class="empty">Nenhuma tarefa encontrada.</div>';return}
  ts.forEach(t=>list.appendChild(taskCard(t)));
}

function renderToday(){
  const t=key(new Date());
  const ts=tasks.filter(x=>x.date===t).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const list=$('todayList');list.innerHTML='';
  if(!ts.length){list.innerHTML='<div class="empty">Nada para hoje. 🌱</div>';return}
  ts.forEach(x=>list.appendChild(taskCard(x)));
}

function renderAll(){renderCalendar();renderTasks();renderToday()}

$('f').addEventListener('submit',ev=>{
  ev.preventDefault();
  const title=$('title').value.trim();if(!title)return;
  const who=$('who2').value.trim()||$('me').value.trim();
  const date=$('date').value||sel;
  const time=$('time').value;
  addTask({title,who,date,time});
  $('title').value='';$('time').value='';
});

$('prev').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderAll()};
$('next').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);renderAll()};
$('search').addEventListener('input',e=>{search=e.target.value;renderTasks()});
$('sort').addEventListener('change',e=>{sort=e.target.value;renderTasks()});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');filter=b.dataset.f;renderTasks();
}));

// init date
$('date').value=sel;
renderAll();
