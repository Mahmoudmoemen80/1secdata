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

  $(id).addEventListener(
    "input",
    e => {

      e.target.value =
        normalizeName(
          e.target.value
        );

    }
  );

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


        // ===============================
        // هاتف ولي الأمر
        // ===============================

        const guardianPhone =
          normalizePhone(
            $("guardianPhone").value
          );


        // ===============================
        // العنوان
        // ===============================

        const address =
          $("address")
            .value
            .trim();


        // ===============================
        // التحقق من هاتف الطالب
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
        // التحقق من اسم ولي الأمر
        // ===============================

        if (
          guardianName.length < 3 ||
          !/^[A-Za-z؀-ۿ]+(?:\s+[A-Za-z؀-ۿ]+)*$/.test(
            guardianName
          )
        ) {

          msg(
            "اسم ولي الأمر يجب أن يحتوي على حروف فقط."
          );

          $("guardianName").focus();

          return;
        }


        // ===============================
        // التحقق من هاتف ولي الأمر
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
        // التحقق من العنوان
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


          // ===============================
          // خطأ Supabase
          // ===============================

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
          // نتيجة الدالة
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
