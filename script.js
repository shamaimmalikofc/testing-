
// ── Data ──
const SK = 'kf4';
let state = JSON.parse(localStorage.getItem(SK) || 'null') || {
  projects: [
    { id: uid(), name: 'Website Redesign', tasks: [
      {id:uid(),title:'Define project scope',   desc:'Outline deliverables and milestones.',          priority:'high',  col:'todo'},
      {id:uid(),title:'Create wireframes',       desc:'Sketch low-fidelity dashboard frames.',         priority:'medium',col:'todo'},
      {id:uid(),title:'Set up CI/CD pipeline',   desc:'Configure GitHub Actions for deployment.',      priority:'high',  col:'inprogress'},
      {id:uid(),title:'Design component library',desc:'Build reusable UI components in Figma.',        priority:'medium',col:'inprogress'},
      {id:uid(),title:'Write API documentation', desc:'Document REST endpoints with OpenAPI spec.',    priority:'low',   col:'completed'},
      {id:uid(),title:'User research interviews',desc:'Conducted 8 interviews, synthesised findings.', priority:'high',  col:'completed'},
    ]},
    { id: uid(), name: 'Mobile App', tasks: [] },
  ],
  activeId: null
};
state.activeId = state.activeId || state.projects[0]?.id;

function uid(){ return crypto.randomUUID() }
function save(){ localStorage.setItem(SK, JSON.stringify(state)) }
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function activeProj(){ return state.projects.find(p=>p.id===state.activeId) }

let editId=null, dragId=null;

// ── Render board ──
function render(q=''){
  const proj = activeProj();
  const tasks = proj ? proj.tasks : [];
  document.getElementById('sb-proj-name').textContent = proj ? proj.name : '—';
  document.getElementById('proj-name-display').textContent = proj ? proj.name : '';

  const q2 = q.trim().toLowerCase();
  const cols = {todo:[],inprogress:[],completed:[]};
  tasks.forEach(t=>{
    if(!q2 || t.title.toLowerCase().includes(q2) || t.desc.toLowerCase().includes(q2)) cols[t.col]?.push(t);
  });

  for(const col in cols){
    const el = document.getElementById('col-'+col);
    el.innerHTML = '';
    if(!cols[col].length){
      el.innerHTML=`<div class="empty"><div class="empty-ico"><svg width="16" height="16" fill="none" stroke="var(--muted)" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg></div><p>No tasks.<br/>Drop or add new.</p></div>`;
    } else {
      cols[col].forEach(t=>el.appendChild(mkCard(t)));
    }
    document.getElementById('cnt-'+col).textContent = cols[col].length;
  }

  const tot=tasks.length, done=tasks.filter(t=>t.col==='completed').length, pct=tot?Math.round(done/tot*100):0;
  document.getElementById('s-total').textContent=tot;
  document.getElementById('s-todo').textContent=tasks.filter(t=>t.col==='todo').length;
  document.getElementById('s-inp').textContent=tasks.filter(t=>t.col==='inprogress').length;
  document.getElementById('s-done').textContent=done;
  document.getElementById('ring-pct').textContent=pct+'%';
  document.getElementById('ring').style.strokeDashoffset=251.3-(pct/100)*251.3;
}

// ── Card ──
function mkCard(t){
  const pc={low:['p-low','● Low'],medium:['p-med','● Med'],high:['p-hi','● High']}[t.priority]||['p-med','● Med'];
  const d=document.createElement('div');
  d.className='card'; d.draggable=true; d.dataset.id=t.id;
  d.innerHTML=`
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:9px">
      <span class="pill ${pc[0]}">${pc[1]}</span>
      <div style="position:relative;flex-shrink:0">
        <button class="dots" data-id="${t.id}"><svg width="15" height="15" fill="var(--muted)" viewBox="0 0 20 20"><circle cx="4" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="16" cy="10" r="1.6"/></svg></button>
        <div class="mpop" id="m-${t.id}">
          <div class="mrow edit-it" data-id="${t.id}"><svg width="12" height="12" fill="none" stroke="var(--a2)" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>Edit</div>
          <div class="mrow del del-it" data-id="${t.id}"><svg width="12" height="12" fill="none" stroke="var(--red-t)" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>Delete</div>
        </div>
      </div>
    </div>
    <p style="font-size:13.5px;font-weight:700;line-height:1.4;margin-bottom:${t.desc?'6px':'0'}">${esc(t.title)}</p>
    ${t.desc?`<p style="font-size:12px;color:var(--t2);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(t.desc)}</p>`:''}
  `;

  // ── Drag fix: store id in dataTransfer, not a module-scope var ──
  d.addEventListener('dragstart', e=>{
    dragId = t.id;
    e.dataTransfer.setData('text/plain', t.id); // required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    // Defer opacity so ghost image captures normal card first
    setTimeout(()=>d.classList.add('drag'), 0);
  });
  d.addEventListener('dragend', ()=>{ d.classList.remove('drag'); dragId=null; });
  return d;
}

// ── Drag & Drop — zones are the columns, children are ignored ──
function setupZones(){
  document.querySelectorAll('.zone').forEach(zone=>{
    zone.addEventListener('dragover', e=>{
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      zone.classList.add('over');
    });
    // relatedTarget check: only remove highlight if truly leaving this zone
    zone.addEventListener('dragleave', e=>{
      if(!zone.contains(e.relatedTarget)) zone.classList.remove('over');
    });
    zone.addEventListener('drop', e=>{
      e.preventDefault();
      zone.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain') || dragId;
      const proj = activeProj(); if(!proj) return;
      const t = proj.tasks.find(x=>x.id===id);
      if(t){ t.col=zone.dataset.col; save(); render(document.getElementById('search').value); }
    });
  });
}

// ── Task modal ──
function openModal(task=null){
  editId=task?.id||null;
  document.getElementById('modal-title').textContent=task?'Edit Task':'New Task';
  document.getElementById('f-title').value=task?.title||'';
  document.getElementById('f-desc').value=task?.desc||'';
  document.getElementById('f-priority').value=task?.priority||'medium';
  document.getElementById('f-col').value=task?.col||'todo';
  document.getElementById('mwrap').classList.add('open');
  setTimeout(()=>document.getElementById('f-title').focus(),50);
}
function closeModal(){ document.getElementById('mwrap').classList.remove('open'); editId=null; }

function saveTask(){
  const title=document.getElementById('f-title').value.trim();
  if(!title){ document.getElementById('f-title').focus(); return; }
  const proj=activeProj(); if(!proj) return;
  const p={title,desc:document.getElementById('f-desc').value.trim(),priority:document.getElementById('f-priority').value,col:document.getElementById('f-col').value};
  if(editId){ const i=proj.tasks.findIndex(t=>t.id===editId); if(i>-1) proj.tasks[i]={...proj.tasks[i],...p}; }
  else proj.tasks.push({id:uid(),...p});
  save(); closeModal(); render(document.getElementById('search').value);
}

// ── Project modal ──
function openProjModal(){
  renderProjList();
  document.getElementById('pmwrap').classList.add('open');
}
function closeProjModal(){ document.getElementById('pmwrap').classList.remove('open'); }

function renderProjList(){
  const list=document.getElementById('proj-list');
  list.innerHTML='';
  state.projects.forEach(p=>{
    const item=document.createElement('div');
    item.className='proj-item'+(p.id===state.activeId?' active':'');
    const done=p.tasks.filter(t=>t.col==='completed').length;
    item.innerHTML=`
      <div>
        <p style="font-size:14px;font-weight:700">${esc(p.name)}</p>
        <p style="font-size:11px;color:var(--muted);margin-top:1px">${p.tasks.length} task${p.tasks.length!==1?'s':''} · ${done} done</p>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        ${p.id===state.activeId?`<span style="font-size:10px;font-weight:700;background:rgba(99,102,241,.15);color:var(--a2);padding:2px 8px;border-radius:99px">Active</span>`:''}
        <button class="del-proj bi" data-pid="${p.id}" style="width:28px;height:28px;border-radius:7px" title="Delete project"><svg width="12" height="12" fill="none" stroke="var(--red-t)" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
      </div>
    `;
    item.addEventListener('click', e=>{
      if(e.target.closest('.del-proj')) return;
      state.activeId=p.id; save(); render(); closeProjModal();
    });
    list.appendChild(item);
  });
}

function createProject(){
  const name=document.getElementById('new-proj-name').value.trim();
  if(!name) return;
  const p={id:uid(),name,tasks:[]};
  state.projects.push(p);
  state.activeId=p.id;
  document.getElementById('new-proj-name').value='';
  save(); render(); renderProjList();
}

// ── Global click ──
document.addEventListener('click', e=>{
  document.querySelectorAll('.mpop.open').forEach(m=>m.classList.remove('open'));
  const dots=e.target.closest('.dots');
  if(dots){ document.getElementById('m-'+dots.dataset.id)?.classList.toggle('open'); return; }
  const ei=e.target.closest('.edit-it');
  if(ei){ const p=activeProj(); if(p) openModal(p.tasks.find(x=>x.id===ei.dataset.id)); return; }
  const di=e.target.closest('.del-it');
  if(di){
    const p=activeProj(); if(!p) return;
    const t=p.tasks.find(x=>x.id===di.dataset.id);
    if(t&&confirm(`Delete "${t.title}"?`)){ p.tasks=p.tasks.filter(x=>x.id!==di.dataset.id); save(); render(document.getElementById('search').value); }
    return;
  }
  const dp=e.target.closest('.del-proj');
  if(dp){
    const pid=dp.dataset.pid;
    const proj=state.projects.find(x=>x.id===pid);
    if(proj&&confirm(`Delete project "${proj.name}"?`)){
      state.projects=state.projects.filter(x=>x.id!==pid);
      if(state.activeId===pid) state.activeId=state.projects[0]?.id||null;
      save(); render(); renderProjList();
    }
  }
});

// ── Theme ──
function applyTheme(dark){
  document.documentElement.classList.toggle('dark',dark);
  document.body.classList.toggle('light',!dark);
  document.getElementById('ico-moon').classList.toggle('hidden',!dark);
  document.getElementById('ico-sun').classList.toggle('hidden',dark);
  localStorage.setItem('kf4_t',dark?'dark':'light');
}

// ── Wiring ──
document.getElementById('new-proj-btn').onclick=openProjModal;
document.getElementById('proj-picker-btn').onclick=openProjModal;
document.getElementById('add-task-btn').onclick=()=>openModal();
document.getElementById('btn-save').onclick=saveTask;
document.getElementById('create-proj-btn').onclick=createProject;
document.getElementById('new-proj-name').addEventListener('keydown',e=>{ if(e.key==='Enter') createProject(); });
document.getElementById('theme-btn').onclick=()=>applyTheme(!document.documentElement.classList.contains('dark'));
document.getElementById('search').addEventListener('input',e=>render(e.target.value));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeModal(); closeProjModal(); }
  if(e.key==='Enter'&&!e.shiftKey&&document.getElementById('mwrap').classList.contains('open')) saveTask();
});

// ── Init ──
applyTheme(localStorage.getItem('kf4_t')!=='light');
setupZones();
render();