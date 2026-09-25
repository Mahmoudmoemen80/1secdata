```javascript
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
  // =========
```
