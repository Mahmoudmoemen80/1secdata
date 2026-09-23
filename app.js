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
// رقم الهاتف
// ===============================

function normalizePhone(value) {
  return normalizeDigits(value)
    .replace(/\D/g, "")
    .trim();
}


function isValidEgyptianPhone(value) {
  const phone = normalizePhone(value);

  return /^01[0125][0-9]{8}$/.test(phone);
}


// ===============================
// إظهار / إخفاء
// ===============================

function showRegistrationForm() {
  $("registrationSection").classList.remove("hidden");

  $("continueArea").classList.add("hidden");

  setTimeout(() => {
    $("studentPhone").focus();
  }, 100);
}


// ===============================
// زر استكمال البيانات
// ===============================

$("continueBtn").addEventListener("click", () => {

  if (!currentStudent) {
    msg("برجاء البحث عن الطالب أولًا.");
    return;
  }

  showRegistrationForm();
});


// ===============================
// البحث عن الطالب
// ===============================

$("searchForm").addEventListener("submit", async (e) => {

  e.preventDefault();

  $("studentCard").classList.add("hidden");
  $("registrationSection").classList.add("hidden");
  $("continueArea").classList.remove("hidden");

  currentStudent = null;

  const nationalId =
    normalizeNationalId(
      $("nationalId").value
    );

  $("nationalId").value = nationalId;


  if (!/^[0-9]{14}$/.test(nationalId)) {

    msg("الرقم القومي يجب أن يتكون من 14 رقمًا.");

    return;
  }


  msg("جاري البحث...", true);


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


    currentStudent = student;


    // عرض البيانات
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


    // الطالب مسجل بالفعل
    if (student.registered) {

      msg(
        "هذا الطالب مسجل بالفعل.",
        true
      );

      $("continueArea")
        .classList
        .add("hidden");

      $("registrationSection")
        .classList
        .add("hidden");

      return;
    }


    // الطالب غير مسجل
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
});


// ===============================
// منع إدخال حروف في الهاتف
// ===============================

["studentPhone", "guardianPhone"]
  .forEach(id => {

    $(id).addEventListener(
      "input",
      (e) => {

        const normalized =
          normalizePhone(
            e.target.value
          );

        e.target.value =
          normalized.slice(0, 11);
      }
    );
  });


// ===============================
// تسجيل البيانات
// ===============================

$("registerForm").addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    if (!currentStudent) {

      msg(
        "برجاء البحث عن الطالب أولًا."
      );

      return;
    }


    const studentPhone =
      normalizePhone(
        $("studentPhone").value
      );

    const guardianName =
      $("guardianName")
        .value
        .trim();

    const guardianPhone =
      normalizePhone(
        $("guardianPhone").value
      );

    const address =
      $("address")
        .value
        .trim();


    // التحقق من رقم الطالب
    if (!isValidEgyptianPhone(studentPhone)) {

      msg(
        "رقم تليفون الطالب يجب أن يتكون من 11 رقمًا ويبدأ بـ 01."
      );

      $("studentPhone").focus();

      return;
    }


    // التحقق من اسم ولي الأمر
    if (guardianName.length < 3) {

      msg(
        "من فضلك اكتب اسم ولي الأمر بالكامل."
      );

      $("guardianName").focus();

      return;
    }


    // التحقق من رقم ولي الأمر
    if (!isValidEgyptianPhone(guardianPhone)) {

      msg(
        "رقم ولي الأمر يجب أن يتكون من 11 رقمًا ويبدأ بـ 01."
      );

      $("guardianPhone").focus();

      return;
    }


    // منع استخدام نفس الرقمين
    if (studentPhone === guardianPhone) {

      msg(
        "رقم الطالب ورقم ولي الأمر يجب أن يكونا مختلفين."
      );

      $("guardianPhone").focus();

      return;
    }


    if (address.length < 5) {

      msg(
        "من فضلك اكتب العنوان بالتفصيل."
      );

      $("address").focus();

      return;
    }


    $("saveBtn").disabled = true;

    $("saveBtn").textContent =
      "جاري التسجيل...";


    try {

      const { error } =
        await db.rpc(
          "register_student",
          {
            p_student_id:
              currentStudent.id,

            p_student_phone:
              studentPhone,

            p_guardian_name:
              guardianName,

            p_guardian_phone:
              guardianPhone,

            p_address:
              address
          }
        );


      if (error) {

        console.error(
          "Registration error:",
          error
        );


        if (
          error.message &&
          error.message.includes(
            "ALREADY_REGISTERED"
          )
        ) {

          msg(
            "هذا الطالب مسجل بالفعل."
          );

        } else {

          msg(
            "تعذر تسجيل البيانات. يرجى المحاولة مرة أخرى."
          );
        }

        return;
      }


      msg(
        "تم تسجيل البيانات بنجاح.",
        true
      );


      $("registerForm").reset();

      $("registrationSection")
        .classList
        .add("hidden");

      $("continueArea")
        .classList
        .add("hidden");


      currentStudent.registered =
        true;


    } catch (err) {

      console.error(
        "Unexpected registration error:",
        err
      );

      msg(
        "حدث خطأ أثناء التسجيل."
      );


    } finally {

      $("saveBtn").disabled = false;

      $("saveBtn").textContent =
        "تسجيل البيانات";
    }

  }
);
