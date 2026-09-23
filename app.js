const supabase = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
let currentStudent = null;
const $ = id => document.getElementById(id);
function msg(text, ok=false){ $('message').textContent=text; $('message').className=ok?'success':'error'; }
$('searchForm').addEventListener('submit', async e => {
  e.preventDefault(); $('studentCard').classList.add('hidden'); msg('جاري البحث...');
  const nationalId = $('nationalId').value.trim();
  const {data,error}=await supabase.rpc('find_student_by_national_id',{p_national_id:nationalId});
  if(error){ msg('حدث خطأ أثناء البحث.'); console.error(error); return; }
  const student = Array.isArray(data) ? data[0] : data;
  if(!student){ msg('لم يتم العثور على طالب بهذا الرقم القومي.'); return; }
  currentStudent=student;
  $('sName').textContent=student.name||''; $('sCode').textContent=student.student_code||'';
  $('sClass').textContent=student.class_name||''; $('sFile').textContent=student.school_file_number||'';
  $('sNational').textContent=student.national_id||'';
  if(student.registered){ msg('هذا الطالب مسجل بالفعل.',true); $('registerForm').classList.add('hidden'); }
  else { msg('تم العثور على بيانات الطالب.',true); $('registerForm').classList.remove('hidden'); }
  $('studentCard').classList.remove('hidden');
});
$('registerForm').addEventListener('submit', async e=>{
  e.preventDefault(); if(!currentStudent) return;
  $('saveBtn').disabled=true; $('saveBtn').textContent='جاري التسجيل...';
  const {error}=await supabase.rpc('register_student',{p_student_id:currentStudent.id,p_student_phone:$('studentPhone').value.trim(),p_father_phone:$('fatherPhone').value.trim(),p_address:$('address').value.trim()});
  if(error){ msg(error.message.includes('ALREADY_REGISTERED')?'هذا الطالب مسجل بالفعل.':'تعذر تسجيل البيانات.',false); }
  else { msg('تم التسجيل بنجاح',true); $('registerForm').reset(); $('registerForm').classList.add('hidden'); }
  $('saveBtn').disabled=false; $('saveBtn').textContent='تسجيل البيانات';
});
