```js
const db = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

let allRows = [];

const $ = (id) => document.getElementById(id);


/* =========================
   أدوات
========================= */

function show(id, visible) {
  const el = $(id);

  if (el) {
    el.classList.toggle("hidden", !visible);
  }
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/* =========================
   تحميل الطلاب
========================= */

async function load() {

  const { data, error } =
    await db.rpc("admin_student_list");

  if (error) {

    console.error("admin_student_list:", error);

    alert(
      "تعذر تحميل بيانات الطلاب.\n\n" +
      error.message
    );

    return;
  }

  allRows = Array.isArray(data) ? data : [];

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
    String(a).localeCompare(
      String(b),
      "ar"
    )
  );


  $("classFilter").innerHTML =
    '<option value="all">كل الفصول</option>' +
    classes.map(className =>
      `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`
    ).join("");
}


/* =========================
   الفلترة
========================= */

function getFilteredRows() {

  const q =
    $("search").value.trim().toLowerCase();

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
      (status === "registered" && row.registered === true) ||
      (status === "unregistered" && row.registered === false);


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
    allRows.filter(row => row.registered === true).length;

  $("unregistered").textContent =
    allRows.filter(row => row.registered === false).length;


  if (!rows.length) {

    $("rows").innerHTML = `
      <tr>
        <td colspan="12" class="empty">
          لا توجد بيانات مطابقة.
        </td>
      </tr>
    `;

    return;
  }


  $("rows").innerHTML =
    rows.map(row => {

      const index =
        allRows.indexOf(row);


      const status =
        row.registered
          ? `<span class="badge ok">مسجل</span>`
          : `<span class="badge no">غير مسجل</span>`;


      const actions =
        row.registered
          ? `
            <button
              type="button"
              class="details-btn"
              data-action="details"
              data-index="${index}"
            >
              التفاصيل
            </button>

            <button
              type="button"
```
