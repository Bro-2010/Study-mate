const KEY="shs-study-buddy-v2";
const today=()=>new Date().toISOString().slice(0,10);
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const seed={
 profile:{name:"Abdul",school:"Demo Senior High School",level:"SHS 2",programme:"General Science",notifications:false,sound:true,wassce:true},
 subjects:[
  {id:id(),name:"Mathematics",strength:"Average",hours:2},
  {id:id(),name:"English",strength:"Strong",hours:1},
  {id:id(),name:"Chemistry",strength:"Average",hours:2},
  {id:id(),name:"Physics",strength:"Weak",hours:2},
  {id:id(),name:"Biology",strength:"Strong",hours:1},
  {id:id(),name:"Elective Mathematics",strength:"Weak",hours:2}
 ],
 tasks:[
  {id:id(),title:"Solve questions 1–20",subject:"Mathematics",description:"Complete the assigned exercise.",due:addDays(2),priority:"High",minutes:60,done:false},
  {id:id(),title:"Organic Chemistry revision",subject:"Chemistry",description:"Review naming and functional groups.",due:addDays(1),priority:"High",minutes:60,done:false},
  {id:id(),title:"Physics past questions",subject:"Physics",description:"Attempt 10 questions and mark mistakes.",due:addDays(4),priority:"Medium",minutes:60,done:false}
 ],
 exams:[
  {id:id(),subject:"Chemistry",name:"Chemistry Test",date:addDays(2),topics:"Organic chemistry",importance:"High"},
  {id:id(),subject:"Physics",name:"Class Test",date:addDays(8),topics:"Waves and motion",importance:"Medium"}
 ],
 sessions:[
  {id:id(),day:1,start:"17:00",end:"18:00",subject:"Mathematics"},
  {id:id(),day:1,start:"18:30",end:"19:30",subject:"Chemistry"},
  {id:id(),day:3,start:"17:00",end:"18:00",subject:"Physics"},
  {id:id(),day:5,start:"17:30",end:"18:30",subject:"Elective Mathematics"}
 ]
};
function addDays(n){let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
let data=JSON.parse(localStorage.getItem(KEY)||"null")||seed;
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmtDate(s){if(!s)return "No date";return new Date(s+"T12:00:00").toLocaleDateString("en-GH",{day:"numeric",month:"short",year:"numeric"})}
function daysUntil(s){return Math.ceil((new Date(s+"T12:00:00")-new Date(new Date().toDateString()))/86400000)}
function toast(msg){let t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function modal(html){document.querySelector("#modalContent").innerHTML=html;document.querySelector("#modal").classList.remove("hidden")}
function closeModal(){document.querySelector("#modal").classList.add("hidden")}
function subjectNames(){return data.subjects.map(s=>s.name)}
function options(list,selected=""){return list.map(x=>`<option ${x===selected?"selected":""}>${esc(x)}</option>`).join("")}
function render(){
 const d=data.profile, now=new Date(), h=now.getHours();
 document.querySelector("#greeting").textContent=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
 document.querySelector("#studentGreeting").textContent=`${d.name||"Student"}, what do you need to do today?`;
 document.querySelector("#todayDate").textContent=now.toLocaleDateString("en-GH",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 renderHome();renderTasks();renderExams();renderSessions();renderSubjects();renderProgress();renderCalendar();loadSettings();
}
function renderHome(){
 let open=data.tasks.filter(t=>!t.done), dueSoon=open.filter(t=>daysUntil(t.due)<=3);
 let done=data.tasks.filter(t=>t.done).length, total=data.tasks.length;
 document.querySelector("#todayDone").textContent=data.tasks.filter(t=>t.done&&t.completedOn===today()).length;
 document.querySelector("#todayLeft").textContent=open.length;
 document.querySelector("#weekPercent").textContent=total?Math.round(done/total*100)+"%":"0%";
 document.querySelector("#studyHours").textContent=(data.subjects.reduce((a,s)=>a+(+s.hours||0),0)).toFixed(1).replace(".0","")+"h";
 let alert=document.querySelector("#startAlert");
 if(!data.tasks.some(t=>t.done&&t.completedOn===today())){
   alert.classList.remove("hidden");
   alert.textContent=open.length?`You haven't checked off any study work today. Start small: ${recommend().title}.`:"You haven't started a study session today. Add a subject or study session to get moving.";
 }else alert.classList.add("hidden");
 document.querySelector("#todayPlan").innerHTML=buildTodayPlan().map(x=>cardForPlan(x)).join("")||empty("Nothing is scheduled for today. Use “Build today's plan” to get a simple starting point.");
 document.querySelector("#upcoming").innerHTML=(data.exams.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2).map(e=>`<div class="item"><div class="item-top"><div><h3>${esc(e.subject)} — ${esc(e.name)}</h3><div class="meta">${fmtDate(e.date)} · ${Math.max(0,daysUntil(e.date))} day(s) left</div></div><span class="badge ${e.importance.toLowerCase()}">${esc(e.importance)}</span></div><div class="meta">${esc(e.topics||"Topics not added yet")}</div></div>`).join(""))||empty("No exams added yet. Add your next test so the planner can help you prepare.");
 document.querySelector("#subjectProgress").innerHTML=data.subjects.slice(0,6).map(subjectBar).join("")||empty("Add your subjects to start tracking progress.");
}
function empty(s){return `<div class="item muted">${s}</div>`}
function subjectBar(s){
 let total=data.tasks.filter(t=>t.subject===s.name).length, done=data.tasks.filter(t=>t.subject===s.name&&t.done).length;
 let p=total?Math.round(done/total*100):(s.strength==="Strong"?75:s.strength==="Weak"?35:55);
 return `<div class="subject-card"><div class="subject-line"><b>${esc(s.name)}</b><span>${p}% · ${esc(s.strength)}</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`
}
function recommend(){
 let open=data.tasks.filter(t=>!t.done).map(t=>({...t,score:(t.priority==="High"?40:t.priority==="Medium"?25:10)+Math.max(0,7-daysUntil(t.due))*8+(data.subjects.find(s=>s.name===t.subject)?.strength==="Weak"?12:0)}));
 let exams=data.exams.map(e=>({title:`${e.subject} — ${e.name}`,subject:e.subject,minutes:45,reason:`Your ${e.subject} ${e.name.toLowerCase()} is ${daysUntil(e.date)<=1?"tomorrow":"in "+daysUntil(e.date)+" days"}.`,score:(e.importance==="High"?35:18)+Math.max(0,6-daysUntil(e.date))*6+(data.subjects.find(s=>s.name===e.subject)?.strength==="Weak"?12:0)}));
 let best=[...open,...exams].sort((a,b)=>b.score-a.score)[0];
 return best||{title:"Start with one subject for 30 minutes",subject:data.subjects[0]?.name||"a subject",minutes:30,reason:"You have no urgent work yet. A short session is a good start."};
}
function cardForPlan(x){return `<div class="item"><div class="item-top"><div><h3>${esc(x.time)} · ${esc(x.title)}</h3><div class="meta">${esc(x.subject)} · ${x.minutes} min</div></div><button class="secondary" onclick="startRecommended('${esc(x.title)}')">Start</button></div></div>`}
function buildTodayPlan(){
 let rec=recommend(), out=[];
 let open=data.tasks.filter(t=>!t.done).sort((a,b)=>b.priority.localeCompare(a.priority)||a.due.localeCompare(b.due)).slice(0,3);
 let times=["5:00 PM","6:30 PM","8:00 PM"];
 open.forEach((t,i)=>out.push({time:times[i],title:t.title,subject:t.subject,minutes:t.minutes||45}));
 if(!out.length&&data.subjects.length) out.push({time:"5:00 PM",title:"Focused study session",subject:data.subjects.find(s=>s.strength==="Weak")?.name||data.subjects[0].name,minutes:45});
 return out;
}
function startRecommended(title){toast(`Start: ${title}`); if(data.profile.notifications&&"Notification"in window) new Notification("SHS Study Buddy",{body:`Time to work on: ${title}`})}
function renderTasks(){
 let q=document.querySelector("#taskSearch").value.toLowerCase(), f=document.querySelector("#taskFilter").value;
 let list=data.tasks.filter(t=>(!q||`${t.title} ${t.subject}`.toLowerCase().includes(q))&&(f==="all"||(f==="open"&&!t.done)||(f==="done"&&t.done)||(f==="high"&&t.priority==="High")));
 document.querySelector("#taskList").innerHTML=list.sort((a,b)=>a.due.localeCompare(b.due)).map(t=>`<div class="item ${t.done?"done":""}"><div class="item-top"><div><h3>${esc(t.title)}</h3><div class="meta">${esc(t.subject)} · Due ${fmtDate(t.due)} · ${t.minutes||0} min</div></div><span class="badge ${t.priority.toLowerCase()}">${esc(t.priority)}</span></div><p class="small muted">${esc(t.description)}</p><div class="actions"><button class="secondary" onclick="toggleTask('${t.id}')">${t.done?"✓ Completed":"Mark done"}</button><button class="secondary" onclick="editTask('${t.id}')">Edit</button><button class="danger" onclick="deleteTask('${t.id}')">Delete</button></div></div>`).join("")||empty("No assignments match your search.");
}
function renderExams(){
 document.querySelector("#examList").innerHTML=data.exams.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(e=>`<div class="item"><div class="item-top"><div><h3>${esc(e.subject)} — ${esc(e.name)}</h3><div class="meta">${fmtDate(e.date)} · ${Math.max(0,daysUntil(e.date))} day(s) left</div></div><span class="badge ${e.importance.toLowerCase()}">${esc(e.importance)}</span></div><p class="small muted">Topics: ${esc(e.topics||"Add topics")}</p><div class="actions"><button class="secondary" onclick="editExam('${e.id}')">Edit</button><button class="danger" onclick="deleteExam('${e.id}')">Delete</button></div></div>`).join("")||empty("No exams yet. Add a test or exam date.");
}
function renderSessions(){
 let days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
 document.querySelector("#sessionList").innerHTML=data.sessions.slice().sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start)).map(s=>`<div class="item"><div class="item-top"><div><h3>${days[s.day]} · ${s.start}–${s.end}</h3><div class="meta">${esc(s.subject)}</div></div><button class="danger" onclick="deleteSession('${s.id}')">Delete</button></div></div>`).join("")||empty("No study sessions yet. Add a simple weekly routine.");
}
function renderSubjects(){document.querySelector("#subjectList").innerHTML=data.subjects.map(s=>`<div class="item"><div class="item-top"><div><h3>${esc(s.name)}</h3><div class="meta">${esc(s.strength)} · ${s.hours||0} planned hours/week</div></div><button class="secondary" onclick="editSubject('${s.id}')">Edit</button></div>${subjectBar(s)}</div>`).join("")||empty("No subjects yet. Add the subjects you study.")}
function renderProgress(){
 let total=data.tasks.length, done=data.tasks.filter(t=>t.done).length,p=total?Math.round(done/total*100):0;
 document.querySelector("#overallRing").textContent=p+"%";
 document.querySelector("#progressMessage").textContent=p>=80?"Strong week. Keep the routine going.":p>=50?"Good progress. Finish a few more tasks.":"Don't worry about the percentage. Start with one small task today.";
 document.querySelector("#progressSubjects").innerHTML=data.subjects.map(subjectBar).join("")||empty("Add subjects first.");
}
function renderCalendar(){
 let date=document.querySelector("#calendarDate").value||today();document.querySelector("#calendarDate").value=date;
 let items=[...data.tasks.filter(t=>t.due===date).map(t=>`<div class="item"><b>Assignment</b><h3>${esc(t.title)}</h3><div class="meta">${esc(t.subject)} · ${esc(t.priority)}</div></div>`),...data.exams.filter(e=>e.date===date).map(e=>`<div class="item"><b>Exam</b><h3>${esc(e.subject)} — ${esc(e.name)}</h3><div class="meta">${esc(e.topics)}</div></div>`)];
 document.querySelector("#calendarItems").innerHTML=items.join("")||empty("Nothing is scheduled for this date.");
}
function formTask(t={}){
 modal(`<h2>${t.id?"Edit":"Add"} assignment</h2><form id="taskForm">
<label>Title<input name="title" required value="${esc(t.title||"")}"></label>
<label>Subject<select name="subject" required>${options(subjectNames(),t.subject)}</select></label>
<label>Description<input name="description" value="${esc(t.description||"")}"></label>
<label>Due date<input name="due" type="date" required value="${t.due||today()}"></label>
<label>Priority<select name="priority">${options(["Low","Medium","High"],t.priority||"Medium")}</select></label>
<label>Estimated minutes<input name="minutes" type="number" min="5" step="5" value="${t.minutes||45}"></label>
<button class="primary wide">Save assignment</button></form>`);
 document.querySelector("#taskForm").onsubmit=e=>{e.preventDefault();let x=Object.fromEntries(new FormData(e.target));if(t.id)Object.assign(t,{...x,minutes:+x.minutes});else data.tasks.push({id:id(),...x,minutes:+x.minutes,done:false});save();closeModal();render();toast("Assignment saved.");}
}
function formExam(x={}){
 modal(`<h2>${x.id?"Edit":"Add"} exam</h2><form id="examForm">
<label>Subject<select name="subject" required>${options(subjectNames(),x.subject)}</select></label><label>Exam / test name<input name="name" required value="${esc(x.name||"")}"></label><label>Exam date<input name="date" type="date" required value="${x.date||addDays(7)}"></label><label>Topics to study<input name="topics" value="${esc(x.topics||"")}"></label><label>Importance<select name="importance">${options(["Low","Medium","High"],x.importance||"Medium")}</select></label><button class="primary wide">Save exam</button></form>`);
 document.querySelector("#examForm").onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));if(x.id)Object.assign(x,v);else data.exams.push({id:id(),...v});save();closeModal();render();toast("Exam saved.");}
}
function formSession(){
 modal(`<h2>Add study session</h2><form id="sessionForm"><label>Day<select name="day">${options(["0","1","2","3","4","5","6"],"1")}</select></label><label>Start<input type="time" name="start" value="17:00"></label><label>End<input type="time" name="end" value="18:00"></label><label>Subject<select name="subject">${options(subjectNames())}</select></label><button class="primary wide">Save session</button></form>`);
 document.querySelector("#sessionForm").onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));data.sessions.push({id:id(),...v,day:+v.day});save();closeModal();render();toast("Study session added.");}
}
function formSubject(s={}){
 modal(`<h2>${s.id?"Edit":"Add"} subject</h2><form id="subjectForm"><label>Subject name<input name="name" required value="${esc(s.name||"")}"></label><label>Strength<select name="strength">${options(["Strong","Average","Weak"],s.strength||"Average")}</select></label><label>Planned study hours/week<input name="hours" type="number" min="0" max="30" step=".5" value="${s.hours||1}"></label><button class="primary wide">Save subject</button></form>`);
 document.querySelector("#subjectForm").onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));v.hours=+v.hours;if(s.id)Object.assign(s,v);else data.subjects.push({id:id(),...v});save();closeModal();render();toast("Subject saved.");}
}
function toggleTask(i){let t=data.tasks.find(x=>x.id===i);if(!t)return;t.done=!t.done;t.completedOn=t.done?today():null;save();render();toast(t.done?"Nice work — task completed.":"Task marked unfinished.");}
function deleteTask(i){if(confirm("Delete this assignment?")){data.tasks=data.tasks.filter(t=>t.id!==i);save();render();toast("Assignment deleted.");}}
function editTask(i){let t=data.tasks.find(x=>x.id===i);if(t)formTask(t)}
function deleteExam(i){if(confirm("Delete this exam?")){data.exams=data.exams.filter(x=>x.id!==i);save();render()}}
function editExam(i){let x=data.exams.find(e=>e.id===i);if(x)formExam(x)}
function deleteSession(i){data.sessions=data.sessions.filter(x=>x.id!==i);save();render()}
function editSubject(i){let s=data.subjects.find(x=>x.id===i);if(s)formSubject(s)}
function loadSettings(){let p=data.profile;for(let [id,v] of Object.entries({setName:p.name,setSchool:p.school,setLevel:p.level,setProgramme:p.programme})){let el=document.querySelector("#"+id);if(el)el.value=v||""}document.querySelector("#notifToggle").checked=!!p.notifications;document.querySelector("#soundToggle").checked=p.sound!==false;document.querySelector("#wassaToggle").checked=!!p.wassce}
function saveSettings(){let p=data.profile;p.name=document.querySelector("#setName").value.trim()||"Student";p.school=document.querySelector("#setSchool").value.trim();p.level=document.querySelector("#setLevel").value;p.programme=document.querySelector("#setProgramme").value.trim();p.notifications=document.querySelector("#notifToggle").checked;p.sound=document.querySelector("#soundToggle").checked;p.wassce=document.querySelector("#wassaToggle").checked;save();render();toast("Settings saved.");}
async function requestNotifications(){if(!("Notification"in window)){toast("This browser does not support phone notifications.");return}let permission=await Notification.requestPermission();if(permission==="granted"){data.profile.notifications=true;save();new Notification("SHS Study Buddy",{body:"Reminders are now enabled. We'll keep them gentle."});toast("Phone notifications enabled.");}else toast("Notification permission was not allowed. You can change it in browser settings.")}
function runReminderCheck(){if(!data.profile.notifications)return;let now=new Date();let key="reminder-"+today();let open=data.tasks.filter(t=>!t.done);let exam=data.exams.find(e=>daysUntil(e.date)>=0&&daysUntil(e.date)<=2);let message;if(!open.length)message="You have no unfinished assignments. A short revision session could be useful.";else if(!data.tasks.some(t=>t.done&&t.completedOn===today()))message=`You haven't completed a study task today. Try: ${recommend().title}`;else if(exam)message=`${exam.subject} ${exam.name} is coming up ${daysUntil(exam.date)===0?"today":"soon"}.`;else return;if(localStorage.getItem(key)!==message){localStorage.setItem(key,message);if("Notification"in window&&Notification.permission==="granted")new Notification("SHS Study Buddy",{body:message});toast(message)}}
function showPage(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===page));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));scrollTo(0,0)}
document.addEventListener("click",e=>{let p=e.target.closest("[data-page]");if(p)showPage(p.dataset.page)});
document.querySelector("#closeModal").onclick=closeModal;
document.querySelector("#addTaskBtn").onclick=()=>{if(!data.subjects.length){toast("Add a subject first.");showPage("subjects");return}formTask()};
document.querySelector("#addExamBtn").onclick=()=>{if(!data.subjects.length){toast("Add a subject first.");showPage("subjects");return}formExam()};
document.querySelector("#addSessionBtn").onclick=()=>{if(!data.subjects.length){toast("Add a subject first.");showPage("subjects");return}formSession()};
document.querySelector("#addSubjectBtn").onclick=()=>formSubject();
document.querySelector("#nextTaskBtn").onclick=()=>{let r=recommend();modal(`<h2>Your next step</h2><div class="item"><h3>${esc(r.title)}</h3><p class="muted">${esc(r.reason||"This is the most useful next task based on your current work.")}</p><p><b>Suggested time:</b> ${r.minutes||45} minutes</p><button class="primary wide" onclick="closeModal();startRecommended('${esc(r.title)}')">Start this task</button></div>`)};
document.querySelector("#autoPlanBtn").onclick=()=>{showPage("home");toast("Today's plan has been refreshed.");render()};
document.querySelector("#taskSearch").oninput=renderTasks;document.querySelector("#taskFilter").onchange=renderTasks;
document.querySelector("#calendarDate").onchange=renderCalendar;
document.querySelector("#saveSettings").onclick=saveSettings;document.querySelector("#notifyBtn").onclick=requestNotifications;
document.querySelector("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("dark",document.body.classList.contains("dark"))};
document.querySelector("#resetBtn").onclick=()=>{if(confirm("Reset SHS Study Buddy to its demo data?")){localStorage.removeItem(KEY);location.reload()}};
if(localStorage.getItem("dark")==="true")document.body.classList.add("dark");
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
render();runReminderCheck();setInterval(runReminderCheck,60000);
