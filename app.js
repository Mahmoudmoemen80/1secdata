const supabase = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

let currentStudent = null;

const $ = (id) => document.getElementById(id);

function msg(text, ok = false) {
  const el = $("message");
  el.textContent = text;
  el.className = ok ? "success" : "error";
}

function normalizeNationalId(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\s+/g, "")
    .trim();
}

$("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  $("studentCard").classList.add("hidden");
  currentStudent = null;

  const nationalId = normalizeNationalId($("nationalId").value);

  if (!nationalId) {
    msg("من فضلك أدخل الرقم القومي.");
    return;
  }

  msg("جاري البحث...", true);

  try {
    const { data, error } = await supabase.rpc(
      "find_student_by_national_id",
      { p_national_id: nationalId }
    );

    console.log("Search result:", { data, error, nationalId });

    if (error) {
      console.error("Supabase RPC error:", error);
      msg("حدث خطأ أثناء البحث. حاول مرة أخرى.");
      return;
    }

    const student = Array.isArray(data) ? data[0] : data;

    if (!student) {
      msg("لم يتم العثور على طالب بهذا الرقم القومي.");
      return;
    }

    currentStudent = student;

    $("sName").textContent = student.name || "";
    $("sCode").textContent = student.student_code || "";
    $("sClass").textContent = student.class_name || "";
    $("sFile").textContent = student.school_file_number || "";
    $("sNational").textContent = student.national_id || "";

    if (student.registered) {
      msg("هذا الطالب مسجل بالفعل.", true);
      $("registerForm").classList.add("hidden");
    } else {
      msg("تم العثور على بيانات الطالب.", true);
      $("registerForm").classList.remove("hidden");
    }

    $("studentCard").classList.remove("hidden");

  } catch (err) {
    console.error("Unexpected search error:", err);
    msg("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
  }
});

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentStudent) return;

  $("saveBtn").disabled = true;
  $("saveBtn").textContent = "جاري التسجيل...";

  try {
    const { error } = await supabase.rpc("register_student", {
      p_student_id: currentStudent.id,
      p_student_phone: $("studentPhone").value.trim(),
      p_father_phone: $("fatherPhone").value.trim(),
      p_address: $("address").value.trim()
    });

    if (error) {
      console.error("Registration error:", error);

      msg(
        error.message.includes("ALREADY_REGISTERED")
          ? "هذا الطالب مسجل بالفعل."
          : "تعذر تسجيل البيانات."
      );
    } else {
      msg("تم التسجيل بنجاح", true);
      $("registerForm").reset();
      $("registerForm").classList.add("hidden");
    }

  } catch (err) {
    console.error("Unexpected registration error:", err);
    msg("حدث خطأ أثناء التسجيل.");

  } finally {
    $("saveBtn").disabled = false;
    $("saveBtn").textContent = "تسجيل البيانات";
  }
});
