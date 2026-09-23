const supabase = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
let allRows=[];
const $=id=>document.getElementById(id);
function show(id,on){$(id).classList.toggle('hidden',!on)}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function load(){
 const {data,error}=await supabase.rpc('admin_student_list');
 if(error){alert('تعذر تحميل النتائج.');console.error(error);return;}
 allRows=data||[]; renderFilters(); render();
}
function renderFilters(){const classes=[...new Set(allRows.map(x=>x.class_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ar')); const s=$('classFilter'); s.innerHTML='<option value="all">كل الفصول</option>'+classes.map(c=>`<option>${escapeHtml(c)}</option>`).join('');}
function render(){
 const q=$('search').value.trim().toLowerCase(), st=$('status').value, cl=$('classFilter').value;
 const rows=allRows.filter(x=>(!q||[x.name,x.student_code,x.national_id].some(v=>String(v??'').toLowerCase().includes(q)))&&(st==='all'||(st==='registered'?x.registered:x.registered===false))&&(cl==='all'||x.class_name===cl));
 $('total').textContent=allRows.length; $('registered').textContent=allRows.filter(x=>x.registered).length; $('unregistered').textContent=allRows.filter(x=>!x.registered).length;
 $('rows').innerHTML=rows.map(x=>`<tr><td>${x.student_number}</td><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.student_code)}</td><td>${escapeHtml(x.class_name)}</td><td>${escapeHtml(x.national_id)}</td><td>${escapeHtml(x.student_phone||'—')}</td><td>${escapeHtml(x.father_phone||'—')}</td><td>${escapeHtml(x.address||'—')}</td><td><span class="badge ${x.registered?'ok':'no'}">${x.registered?'مسجل':'غير مسجل'}</span></td></tr>`).join('');
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault(); const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value}); if(error){$('loginMsg').textContent='بيانات الدخول غير صحيحة أو الحساب غير مصرح له.';return;} $('loginMsg').textContent=''; show('loginCard',false); show('dashboard',true); await load();});
$('logoutBtn').onclick=async()=>{await supabase.auth.signOut(); location.reload()};
$('search').oninput=render; $('status').onchange=render; $('classFilter').onchange=render;
$('exportBtn').onclick=()=>{const q=$('search').value.trim().toLowerCase(),st=$('status').value,cl=$('classFilter').value; const rows=allRows.filter(x=>(!q||[x.name,x.student_code,x.national_id].some(v=>String(v??'').toLowerCase().includes(q)))&&(st==='all'||(st==='registered'?x.registered:x.registered===false))&&(cl==='all'||x.class_name===cl)); const headers=['رقم','الاسم','الكود','الفصل','الرقم القومي','هاتف الطالب','هاتف الأب','العنوان','الحالة']; const lines=[headers,...rows.map(x=>[x.student_number,x.name,x.student_code,x.class_name,x.national_id,x.student_phone||'',x.father_phone||'',x.address||'',x.registered?'مسجل':'غير مسجل'])].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')); const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='نتائج_التسجيل.csv'; a.click(); URL.revokeObjectURL(a.href);};
(async()=>{const {data:{session}}=await supabase.auth.getSession(); if(session){show('loginCard',false);show('dashboard',true);load();}})();
