```js
const db = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

let allRows = [];

const $ = (id) => document.getElementById(id);


/* =========================
   أدوات عامة
========================= */

function show(id, visible) {
  const el = $(id);
  if (el) {
    el.classList.toggle("hidden", !visible);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/[&<>'"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return value;
  }
}


/* =========================
   تحميل البيانات
========================= */

async function load() {

  const { data, error } = await db.rpc(
    "admin_student_list"
  );

  if (error) {

    console.error("admin_student_list error:", error);

    alert(
      "تعذر تحميل بيانات الطلاب.\n\n" +
      error.message
    );

    return;
  }

  allRows = data || [];

  renderFilters();
  render();
}


/* =========================
   الفصول
========================= */

function renderFilters() {

  const classes = [
    ...new Set(
      allRows
        .map(row => row.class_name)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    String(a).localeCompare(String(b), "ar")
  );

  const select = $("classFilter");

  select.innerHTML =
    '<option value="all">كل الفصول</option>' +
    classes
      .map(className =>
        `<option value="${escapeHtml(className)}">
          ${escapeHtml(className)}
        </option>`
      )
      .join("");
}


/* =========================
   الفلترة
========================= */

function getFilteredRows() {

  const q =
    $("search").value
      .trim()
      .toLowerCase();

  const status =
    $("status").value;

  const className =
    $("classFilter").value;

  return allRows.filter(row => {

    const searchMatch =
      !q ||
      [
        row.name,
        row.student_code,
        row.national_id,
        row.class_name
      ].some(value =>
        String(value ?? "")
          .toLowerCase()
          .includes(q)
      );

    const statusMatch =
      status === "all" ||
      (
        status === "registered" &&
        row.registered === true
      ) ||
      (
        status === "unregistered" &&
        row.registered === false
      );

    const classMatch =
      className === "all" ||
      row.class_name === className;

    return (
      searchMatch &&
      statusMatch &&
      classMatch
    );
  });
}


/* =========================
   عرض الجدول
========================= */

function render() {

  const rows = getFilteredRows();

  $("total").textContent =
    allRows.length;

  $("registered").textContent =
    allRows.filter(row => row.registered).length;

  $("unregistered").textContent =
    allRows.filter(row => !row.registered).length;


  if (!rows.length) {

    $("rows").innerHTML = `
      <tr>
        <td colspan="12" class="empty">
          لا توجد بيانات مطابقة للبحث.
        </td>
      </tr>
    `;

    return;
  }


  $("rows").innerHTML = rows.map(row => {

    const index =
      allRows.indexOf(row) + 1;

    const statusBadge =
      row.registered
        ? `<span class="badge ok">مسجل</span>`
        : `<span class="badge no">غير مسجل</span>`;


    const actions = row.registered
      ? `
        <button
          type="button"
          class="details-btn"
          data-action="details"
          data-index="${index - 1}"
        >
          التفاصيل
        </button>

        <button
          type="button"
          class="cancel-btn"
          data-action="cancel"
          data-index="${index - 1}"
        >
          إلغاء التسجيل
        </button>
      `
      : "—";


    return `
      <tr>

        <td>
          ${escapeHtml(row.student_number)}
        </td>

        <td>
          ${escapeHtml(row.name)}
        </td>

        <td>
          ${escapeHtml(row.student_code)}
        </td>

        <td>
          ${escapeHtml(row.class_name)}
        </td>

        <td>
          ${escapeHtml(row.school_file_number)}
        </td>

        <td>
          ${escapeHtml(row.national_id)}
        </td>

        <td>
          ${escapeHtml(row.student_phone || "—")}
        </td>

        <td>
          ${escapeHtml(row.guardian_name || "—")}
        </td>

        <td>
          ${escapeHtml(row.guardian_phone || "—")}
        </td>

        <td>
          ${escapeHtml(row.address || "—")}
        </td>

        <td>
          ${statusBadge}
        </td>

        <td>
          ${actions}
        </td>

      </tr>
    `;

  }).join("");
}


/* =========================
   تفاصيل الطالب
========================= */

function showDetails(row) {

  $("detailsContent").innerHTML = `

    <div class="detail-row">
      <span>الاسم</span>
      <strong>${escapeHtml(row.name)}</strong>
    </div>

    <div class="detail-row">
      <span>رقم الطالب</span>
      <strong>${escapeHtml(row.student_number)}</strong>
    </div>

    <div class="detail-row">
      <span>كود الطالب</span>
      <strong>${escapeHtml(row.student_code)}</strong>
    </div>

    <div class="detail-row">
      <span>الفصل</span>
      <strong>${escapeHtml(row.class_name)}</strong>
    </div>

    <div class="detail-row">
      <span>رقم الملف</span>
      <strong>${escapeHtml(row.school_file_number)}</strong>
    </div>

    <div class="detail-row">
      <span>الرقم القومي</span>
      <strong>${escapeHtml(row.national_id)}</strong>
    </div>

    <div class="detail-row">
      <span>هاتف الطالب</span>
      <strong>${escapeHtml(row.student_phone || "—")}</strong>
    </div>

    <div class="detail-row">
      <span>اسم ولي الأمر</span>
      <strong>${escapeHtml(row.guardian_name || "—")}</strong>
    </div>

    <div class="detail-row">
      <span>هاتف ولي الأمر</span>
      <strong>${escapeHtml(row.guardian_phone || "—")}</strong>
    </div>

    <div class="detail-row">
      <span>العنوان</span>
      <strong>${escapeHtml(row.address || "—")}</strong>
    </div>

    <div class="detail-row">
      <span>تاريخ التسجيل</span>
      <strong>${escapeHtml(formatDate(row.registered_at))}</strong>
    </div>

  `;

  $("detailsModal").classList.remove("hidden");
}


/* =========================
   إلغاء التسجيل
========================= */

async function cancelRegistration(row) {

  const studentName =
    row.name || "هذا الطالب";


  const confirmed = confirm(
    `هل تريد إلغاء تسجيل الطالب:\n\n${studentName}\n\n` +
    `سيتم حذف بيانات التسجيل فقط، وسيظل الطالب موجودًا في قاعدة البيانات، ` +
    `وبالتالي يستطيع التسجيل مرة أخرى.`
  );

  if (!confirmed) {
    return;
  }


  const { data, error } =
    await db.rpc(
      "cancel_student_registration",
      {
        p_student_id: row.id
      }
    );


  if (error) {

    console.error(
      "cancel_student_registration error:",
      error
    );

    alert(
      "حدث خطأ أثناء إلغاء التسجيل:\n\n" +
      error.message
    );

    return;
  }


  if (!data || data.success !== true) {

    alert(
      data?.message ||
      "لم يتم إلغاء التسجيل."
    );

    return;
  }


  alert(
    "تم إلغاء التسجيل بنجاح.\n\n" +
    "يمكن للطالب الآن التسجيل مرة أخرى."
  );


  await load();
}


/* =========================
   أزرار الجدول
========================= */

$("rows").addEventListener(
  "click",
  async (event) => {

    const button =
      event.target.closest("button");

    if (!button) return;

    const index =
      Number(button.dataset.index);

    if (
      Number.isNaN(index) ||
      !allRows[index]
    ) {
      return;
    }

    const row =
      allRows[index];


    if (
      button.dataset.action ===
      "details"
    ) {

      showDetails(row);

      return;
    }


    if (
      button.dataset.action ===
      "cancel"
    ) {

      await cancelRegistration(row);

    }

  }
);


/* =========================
   إغلاق التفاصيل
========================= */

$("closeDetails").addEventListener(
  "click",
  () => {
    $("detailsModal")
      .classList.add("hidden");
  }
);


$("detailsModal").addEventListener(
  "click",
  event => {

    if (
      event.target ===
      $("detailsModal")
    ) {
      $("detailsModal")
        .classList.add("hidden");
    }

  }
);


/* =========================
   تسجيل الدخول
========================= */

$("loginForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    $("loginMsg").textContent =
      "جاري تسجيل الدخول...";


    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    const { error } =
      await db.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error(error);

      $("loginMsg").textContent =
        "بيانات الدخول غير صحيحة أو الحساب غير مصرح له.";

      return;
    }


    $("loginMsg").textContent = "";

    show("loginCard", false);
    show("dashboard", true);

    await load();
  }
);


/* =========================
   تسجيل الخروج
========================= */

$("logoutBtn").addEventListener(
  "click",
  async () => {

    await db.auth.signOut();

    location.reload();

  }
);


/* =========================
   البحث والفلاتر
========================= */

$("search").addEventListener(
  "input",
  render
);

$("status").addEventListener(
  "change",
  render
);

$("classFilter").addEventListener(
  "change",
  render
);


/* =========================
   تصدير CSV / Excel
========================= */

$("exportBtn").addEventListener(
  "click",
  () => {

    const rows =
      getFilteredRows();


    const headers = [
      "رقم الطالب",
      "الاسم",
      "الكود",
      "الفصل",
      "رقم الملف",
      "الرقم القومي",
      "هاتف الطالب",
      "اسم ولي الأمر",
      "هاتف ولي الأمر",
      "العنوان",
      "الحالة"
    ];


    const data = [
      headers,

      ...rows.map(row => [
        row.student_number,
        row.name,
        row.student_code,
        row.class_name,
        row.school_file_number,
        row.national_id,
        row.student_phone || "",
        row.guardian_name || "",
        row.guardian_phone || "",
        row.address || "",
        row.registered
          ? "مسجل"
          : "غير مسجل"
      ])
    ];


    const csv =
      data
        .map(row =>
          row.map(value =>
            `"${String(value ?? "")
              .replace(/"/g, '""')}"`
          ).join(",")
        )
        .join("\n");


    const blob =
      new Blob(
        ["\ufeff" + csv],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );


    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download =
      "بيانات_الطلاب.csv";

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

  }
);


/* =========================
   التحقق من الجلسة
========================= */

(async () => {

  const {
    data: {
      session
    }
  } =
    await db.auth.getSession();


  if (session) {

    show("loginCard", false);
    show("dashboard", true);

    await load();

  }

})();
```
