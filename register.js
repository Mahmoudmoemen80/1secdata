const db = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

const $ = (id) =>
  document.getElementById(id);


// ===============================
// الرسائل
// ===============================

function msg(text, ok = false) {

  const el = $("message");

  el.textContent = text;

  el.className =
    ok
      ? "message success"
      : "message error";
}


// ===============================
// تحويل الأرقام
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
// الهاتف
// ===============================

function normalizePhone(value) {

  return normalizeDigits(value)
    .replace(/\D/g, "")
    .slice(0, 11);
}


function isValidEgyptianPhone(value) {

  return /^01[0125][0-9]{8}$/.test(
    normalizePhone(value)
  );
}

// ===============================
// الاسم - حروف فقط
// ===============================

function normalizeName(value) {
  return String(value || '')
    .replace(/[^A-Za-z؀-ۿ\s]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart();
}

['guardianName'].forEach(id => {
  $(id).addEventListener('input', e => {
    e.target.value = normalizeName(e.target.value);
  });
});


// ===============================
// الحصول على بيانات الطالب
// ===============================

const storedStudent =
  sessionStorage.getItem(
    "currentStudent"
  );


if (!storedStudent) {

  window.location.href =
    "index.html";

} else {


  let currentStudent;


  try {

    currentStudent =
      JSON.parse(
        storedStudent
      );

  } catch (err) {

    sessionStorage.removeItem(
      "currentStudent"
    );

    window.location.href =
      "index.html";
  }


  // ===============================
  // عرض بيانات الطالب
  // ===============================

  $("sName").textContent =
    currentStudent.name || "";

  $("sCode").textContent =
    currentStudent.student_code || "";

  $("sClass").textContent =
    currentStudent.class_name || "";

  $("sFile").textContent =
    currentStudent.school_file_number || "";

  $("sNational").textContent =
    currentStudent.national_id || "";


  // ===============================
  // الهاتف
  // ===============================

  ["studentPhone", "guardianPhone"]
    .forEach(id => {

      $(id).addEventListener(
        "input",
        e => {

          e.target.value =
            normalizePhone(
              e.target.value
            );

        }
      );

    });


  // ===============================
  // تسجيل البيانات
  // ===============================

  $("registerForm")
    .addEventListener(
      "submit",
      async e => {

        e.preventDefault();


        const studySystem =
          $("studySystem").value.trim();


        const studentPhone =
          normalizePhone(
            $("studentPhone").value
          );


        const guardianName =
          normalizeName($("guardianName").value);


        const guardianPhone =
          normalizePhone(
            $("guardianPhone").value
          );


        const address =
          $("address")
            .value
            .trim();


        // ===============================
        // نظام الدراسة
        // ===============================

        if (!studySystem) {

          msg("من فضلك اختر نظام الدراسة.");

          $("studySystem").focus();

          return;
        }


        // ===============================
        // التحقق من رقم الطالب
        // ===============================

        if (
          !isValidEgyptianPhone(
            studentPhone
          )
        ) {

          msg(
            "رقم تليفون الطالب يجب أن يكون 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015."
          );

          $("studentPhone").focus();

          return;
        }


// ===============================
// اسم ولي الأمر
// ===============================

if (
  guardianName.length < 3 ||
  !/^[A-Za-z؀-ۿ]+(?:\s+[A-Za-z؀-ۿ]+)*$/.test(guardianName)
) {

  msg(
    "اسم ولي الأمر يجب أن يحتوي على حروف فقط."
  );

  $("guardianName").focus();

  return;
}


// ===============================
// منع الطالب من تسجيل نفسه كولي أمر
// ===============================

function normalizeNameForCompare(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}


const studentWords =
  normalizeNameForCompare(
    currentStudent.name
  )
  .split(" ")
  .filter(Boolean);


const guardianWords =
  normalizeNameForCompare(
    guardianName
  )
  .split(" ")
  .filter(Boolean);


// إذا كانت بداية اسم ولي الأمر
// مطابقة لبداية اسم الطالب
if (
  guardianWords.length > 0 &&
  guardianWords.every(
    (word, index) =>
      studentWords[index] === word
  )
) {

  msg(
    "❌ غير مسموح: اسم ولي الأمر لا يمكن أن يكون مطابقًا لاسم الطالب."
  );

  $("guardianName").focus();

  return;
}

        // ===============================
        // هاتف ولي الأمر
        // ===============================

        if (
          !isValidEgyptianPhone(
            guardianPhone
          )
        ) {

          msg(
            "رقم ولي الأمر يجب أن يكون 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015."
          );

          $("guardianPhone").focus();

          return;
        }


        // ===============================
        // العنوان
        // ===============================

        if (
          address.length < 5
        ) {

          msg(
            "من فضلك اكتب العنوان بالتفصيل."
          );

          $("address").focus();

          return;
        }


        // ===============================
        // بدء التسجيل
        // ===============================

        $("saveBtn").disabled =
          true;

        $("saveBtn").textContent =
          "جاري التسجيل...";


        try {

          const { data, error } =
            await db.rpc(
              "register_student",
              {

                p_student_id:
                  currentStudent.id,

                p_student_phone:
                  studentPhone,

                p_study_system:
                  studySystem,

                p_guardian_name:
                  guardianName,

                p_guardian_phone:
                  guardianPhone,

                p_address:
                  address

              }
            );


          console.log(
            "Registration result:",
            {
              data,
              error
            }
          );


          if (error) {

            console.error(
              "Registration error:",
              error
            );

            msg(
              "تعذر تسجيل البيانات. يرجى المحاولة مرة أخرى."
            );

            return;
          }


          // ===============================
          // فحص نتيجة الدالة
          // ===============================

          if (
            data &&
            data.success === false
          ) {

            msg(
              data.message ||
              "تعذر تسجيل البيانات."
            );

            return;
          }


          // ===============================
          // نجاح التسجيل
          // ===============================

          sessionStorage.removeItem(
            "currentStudent"
          );


          window.location.href =
            "success.html";

        } catch (err) {

          console.error(
            "Unexpected registration error:",
            err
          );

          msg(
            "حدث خطأ أثناء التسجيل."
          );

        } finally {

          $("saveBtn").disabled =
            false;

          $("saveBtn").textContent =
            "تسجيل البيانات";

        }

      }
    );

}
