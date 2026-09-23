const db = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

let currentStudent = null;

const $ = (id) => document.getElementById(id);


// ===============================
// الرسائل
// ===============================

function msg(text, ok = false) {

  const el = $("message");

  if (!el) return;

  el.textContent = text;

  el.className = ok
    ? "message success"
    : "message error";
}


// ===============================
// تحويل الأرقام العربية
// ===============================

function normalizeDigits(value) {

  return String(value || "")
    .replace(/[٠-٩]/g, d =>
      String(d.charCodeAt(0) - 0x0660)
    )
    .replace(/[۰-۹]/g, d =>
      String(d.charCodeAt(0) - 0x06F0)
    );
}


// ===============================
// الرقم القومي
// ===============================

function normalizeNationalId(value) {

  return normalizeDigits(value)
    .replace(/\s+/g, "")
    .trim();
}


// ===============================
// زر استكمال البيانات
// ===============================

$("continueBtn").addEventListener("click", () => {

  if (!currentStudent) {

    msg("برجاء البحث عن الطالب أولًا.");

    return;
  }

  /*
    نحفظ بيانات الطالب مؤقتًا حتى تستطيع
    صفحة register.html قراءتها.
  */

  sessionStorage.setItem(
    "currentStudent",
    JSON.stringify(currentStudent)
  );

  /*
    الانتقال إلى صفحة استكمال البيانات
  */

  window.location.href = "register.html";
});


// ===============================
// البحث عن الطالب
// ===============================

$("searchForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    $("studentCard")
      .classList
      .add("hidden");

    $("continueArea")
      .classList
      .remove("hidden");

    currentStudent = null;


    const nationalId =
      normalizeNationalId(
        $("nationalId").value
      );


    $("nationalId").value =
      nationalId;


    if (!/^[0-9]{14}$/.test(nationalId)) {

      msg(
        "الرقم القومي يجب أن يتكون من 14 رقمًا."
      );

      return;
    }


    msg(
      "جاري البحث...",
      true
    );


    try {

      const { data, error } =
        await db.rpc(
          "find_student_by_national_id",
          {
            p_national_id: nationalId
          }
        );


      console.log(
        "Search result:",
        {
          data,
          error,
          nationalId
        }
      );


      if (error) {

        console.error(
          "Supabase RPC error:",
          error
        );

        msg(
          "حدث خطأ أثناء البحث. حاول مرة أخرى."
        );

        return;
      }


      const student =
        Array.isArray(data)
          ? data[0]
          : data;


      if (!student) {

        msg(
          "لم يتم العثور على طالب بهذا الرقم القومي."
        );

        return;
      }


      currentStudent =
        student;


      // ===============================
      // عرض بيانات الطالب
      // ===============================

      $("sName").textContent =
        student.name || "";

      $("sCode").textContent =
        student.student_code || "";

      $("sClass").textContent =
        student.class_name || "";

      $("sFile").textContent =
        student.school_file_number || "";

      $("sNational").textContent =
        student.national_id || "";


      $("studentCard")
        .classList
        .remove("hidden");


      // ===============================
      // الطالب مسجل بالفعل
      // ===============================

      if (student.registered) {

        msg(
          "هذا الطالب مسجل بالفعل.",
          true
        );

        $("continueArea")
          .classList
          .add("hidden");

        return;
      }


      // ===============================
      // الطالب غير مسجل
      // ===============================

      msg(
        "تم العثور على بيانات الطالب. اضغط «استكمال البيانات».",
        true
      );


      $("continueArea")
        .classList
        .remove("hidden");


    } catch (err) {

      console.error(
        "Unexpected search error:",
        err
      );

      msg(
        "حدث خطأ أثناء الاتصال بقاعدة البيانات."
      );
    }

  }
);
