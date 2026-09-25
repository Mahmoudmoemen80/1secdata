const db = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

const $ = (id) =>
  document.getElementById(id);


// ===============================
// الرسائل العامة
// ===============================

function msg(text, ok = false) {

  const el = $("message");

  if (!el) return;

  el.textContent = text;

  el.className =
    ok
      ? "message success"
      : "message error";
}


// ===============================
// رسالة نظام الدراسة
// ===============================

function studySystemMsg(text, type = "error") {

  const el =
    $("studySystemMessage");

  if (!el) return;

  el.textContent = text;

  el.className =
    type === "success"
      ? "success"
      : "error";
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

  return String(value || "")
    .replace(/[^A-Za-z؀-ۿ\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();
}


["guardianName"].forEach(id => {

  const el = $(id);

  if (el) {

    el.addEventListener(
      "input",
      e => {

        e.target.value =
          normalizeName(
            e.target.value
          );

      }
    );

  }

});


// ===============================
// بيانات الطالب
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

    console.error(
      "خطأ في قراءة بيانات الطالب:",
      err
    );

    msg(
      "تعذر قراءة بيانات الطالب. برجاء العودة والبحث عن الطالب مرة أخرى."
    );

    // مهم:
    // لا نحذف currentStudent من sessionStorage
    // حتى لا تضيع بيانات الطالب.

  }


  if (currentStudent) {


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
    // نظام الدراسة
    // ===============================

    $("studySystem").addEventListener(
      "change",
      function () {

        const value =
          this.value.trim();


        // --------------------------------
        // ثانوية عامة
        // --------------------------------

        if (
          value === "ثانوية عامة"
        ) {

          studySystemMsg(
            "عفواً، هذا النظام غير متاح بمدرستك.",
            "error"
          );

          $("saveBtn").disabled =
            true;

          return;
        }


        // --------------------------------
        // بكالوريا
        // --------------------------------

        if (
          value === "بكالوريا"
        ) {

          studySystemMsg(
            "تم اختيار نظام البكالوريا.",
            "success"
          );

          $("saveBtn").disabled =
            false;

          return;
        }


        // --------------------------------
        // لم يتم الاختيار
        // --------------------------------

        const el =
          $("studySystemMessage");

        el.textContent = "";

        el.className = "";

        $("saveBtn").disabled =
          false;

      }
    );


    // ===============================
    // الهاتف
    // ===============================

    [
      "studentPhone",
      "guardianPhone"
    ].forEach(id => {

      const el = $(id);

      if (el) {

        el.addEventListener(
          "input",
          e => {

            e.target.value =
              normalizePhone(
                e.target.value
              );

          }
        );

      }

    });


    // ===============================
    // تسجيل البيانات
    // ===============================

    $("registerForm")
      .addEventListener(
        "submit",
        async e => {

          e.preventDefault();


          // ===============================
          // نظام الدراسة
          // ===============================

          const studySystem =
            $("studySystem")
              .value
              .trim();


          if (!studySystem) {

            msg(
              "من فضلك اختر نظام الدراسة."
            );

            $("studySystem").focus();

            return;
          }


          if (
            studySystem === "ثانوية عامة"
          ) {

            studySystemMsg(
              "عفواً، هذا النظام غير متاح بمدرستك.",
              "error"
            );

            $("saveBtn").disabled =
              true;

            return;
          }


          // ===============================
          // الهاتف
          // ===============================

          const studentPhone =
            normalizePhone(
              $("studentPhone").value
            );


          // ===============================
          // اسم ولي الأمر
          // ===============================

          const guardianName =
            normalizeName(
              $("guardianName").value
            );


          const studentName =
            normalizeName(
              currentStudent.name
            );


          function normalizeNameForCompare(value) {

            return String(value || "")
              .trim()
              .replace(/\s+/g, " ")
              .replace(/[أإآ]/g, "ا")
              .replace(/ى/g, "ي")
              .replace(/ؤ/g, "و")
              .replace(/ئ/g, "ي")
              .replace(/ة/g, "ه")
              .toLowerCase();

          }


          const studentWords =
            normalizeNameForCompare(
              currentStudent.name
            ).split(" ");


          const guardianWords =
            normalizeNameForCompare(
              guardianName
            ).split(" ");


          const sameNameParts =
            guardianWords.length > 0 &&
            guardianWords.every(word =>
              studentWords.includes(word)
            );


          if (sameNameParts) {

            msg(
              "من فضلك اكتب اسم ولي الأمر وليس اسم الطالب."
            );

            $("guardianName").focus();

            return;
          }


          //
