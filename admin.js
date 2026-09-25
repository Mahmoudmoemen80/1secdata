const db = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

let allRows = [];

const $ = (id) => document.getElementById(id);

function show(id, visible) {
  const el = $(id);
  if (el) el.classList.toggle("hidden", !visible);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function load() {
  const { data, error } = await db.rpc("admin_student_list");

  if (error) {
    console.error("admin_student_list:", error);
    alert("تعذر تحميل بيانات الطلاب.\n\n" + error.message);
    return;
  }

  allRows = Array.isArray(data) ? data : [];
  renderFilters();
  render();
}

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

  $("classFilter").innerHTML =
    '<option value="all">كل الفصول</option>' +
    classes.map(className =>
      `<option value="${escapeHtml(className)}">${escapeHtml(className)}</option>`
    ).join("");
}

function getFilteredRows() {
  const q = $("search").value.trim().toLowerCase();
  const status = $("status").value;
  const className = $("classFilter").value;

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

    return searchMatch && statusMatch && classMatch;
  });
}

function render() {
  const rows = getFilteredRows();

  $("total").textContent = allRows.length;

  $("registered").textContent =
    allRows.filter(row => row.registered === true).length;

  $("unregistered").textContent =
    allRows.filter(row => row.registered === false).length;

  if (!rows.length) {
    $("rows").innerHTML = `
      <tr>
        <td colspan="13" class="empty">
          لا توجد بيانات مطابقة.
        </td>
      </tr>
    `;
    return;
  }

  $("rows").innerHTML =
    rows.map(row => {

      const index = allRows.indexOf(row);

      const status =
        row.registered
          ? '<span class="badge ok">مسجل</span>'
          : '<span class="badge no">غير مسجل</span>';

      const actions = `
            <button
              type="button"
              class="details-btn edit-btn"
              data-action="edit"
              data-index="${index}">
              ✏️ تعديل
            </button>

            ${row.registered ? `
            <button
              type="button"
              class="details-btn"
              data-action="details"
              data-index="${index}">
              التفاصيل
            </button>

            <button
              type="button"
              class="cancel-btn"
              data-action="cancel"
              data-index="${index}">
              إلغاء التسجيل
            </button>
          ` : ""}
          `;

      return `
        <tr>
          <td>${escapeHtml(row.student_number)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.student_code)}</td>
          <td>${escapeHtml(row.study_system || "—")}</td>
          <td>${escapeHtml(row.class_name)}</td>
          <td>${escapeHtml(row.school_file_number)}</td>
          <td>${escapeHtml(row.national_id)}</td>
          <td>${escapeHtml(row.student_phone || "—")}</td>
          <td>${escapeHtml(row.guardian_name || "—")}</td>
          <td>${escapeHtml(row.guardian_phone || "—")}</td>
          <td>${escapeHtml(row.address || "—")}</td>
          <td>${status}</td>
          <td>${actions}</td>
        </tr>
      `;
    }).join("");
}

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
      <span>نظام الدراسة</span>
      <strong>${escapeHtml(row.study_system || "—")}</strong>
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
  `;

  $("detailsModal").classList.remove("hidden");
}


function normalizeDigits(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));
}

function normalizePhone(value) {
  return normalizeDigits(value).replace(/\D/g, "").slice(0, 11);
}

function normalizeName(value) {
  return String(value || "")
    .replace(/[^A-Za-z؀-ۿ\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();
}

["editName", "editGuardianName"].forEach(id => {
  $(id).addEventListener("input", e => {
    e.target.value = normalizeName(e.target.value);
  });
});

function openEdit(row) {
  $("editId").value = row.id ?? "";
  $("editStudentNumber").value = row.student_number ?? "";
  $("editName").value = row.name ?? "";
  $("editNationalId").value = row.national_id ?? "";
  $("editStudentCode").value = row.student_code ?? "";
  $("editGender").value = row.gender ?? "";
  $("editStudySystem").value = row.study_system ?? "";
  $("editClassName").value = row.class_name ?? "";
  $("editFileNumber").value = row.school_file_number ?? "";
  $("editStudentPhone").value = row.student_phone ?? "";
  $("editGuardianName").value = row.guardian_name ?? "";
  $("editGuardianPhone").value = row.guardian_phone ?? "";
  $("editAddress").value = row.address ?? "";
  $("editMsg").textContent = "";
  $("editMsg").className = "";
  $("editModal").classList.remove("hidden");
}

function closeEdit() {
  $("editModal").classList.add("hidden");
}

["editStudentPhone", "editGuardianPhone"].forEach(id => {
  $(id).addEventListener("input", e => {
    e.target.value = normalizePhone(e.target.value);
  });
});

$("editForm").addEventListener("submit", async event => {
  event.preventDefault();

  const studentId = Number($("editId").value);
  const studentNumber = Number($("editStudentNumber").value);
  const name = normalizeName($("editName").value);
  const nationalId = normalizeDigits($("editNationalId").value).replace(/\s+/g, "");
  const studentCode = $("editStudentCode").value.trim();
  const gender = $("editGender").value.trim();
  const studySystem = $("editStudySystem").value.trim();
  const className = $("editClassName").value.trim();
  const fileNumber = $("editFileNumber").value.trim();
  const studentPhone = normalizePhone($("editStudentPhone").value);
  const guardianName = normalizeName($("editGuardianName").value);
  const guardianPhone = normalizePhone($("editGuardianPhone").value);
  const address = $("editAddress").value.trim();

  if (!studentId || !Number.isInteger(studentNumber) || !name || !/^[A-Za-z؀-ۿ]+(?:\s+[A-Za-z؀-ۿ]+)*$/.test(name) || !/^[0-9]{14}$/.test(nationalId) || !studySystem) {
    $("editMsg").textContent = "راجع البيانات المطلوبة، خاصة الاسم والرقم القومي ونظام الدراسة.";
    $("editMsg").className = "message error";
    return;
  }

  if (studentPhone && !/^01[0125][0-9]{8}$/.test(studentPhone)) {
    $("editMsg").textContent = "هاتف الطالب يجب أن يكون رقمًا مصريًا صحيحًا من 11 رقمًا.";
    $("editMsg").className = "message error";
    $("editStudentPhone").focus();
    return;
  }

  if (guardianName && !/^[A-Za-z؀-ۿ]+(?:\s+[A-Za-z؀-ۿ]+)*$/.test(guardianName)) {
    $("editMsg").textContent = "اسم ولي الأمر يجب أن يحتوي على حروف فقط.";
    $("editMsg").className = "message error";
    $("editGuardianName").focus();
    return;
  }

  if (guardianPhone && !/^01[0125][0-9]{8}$/.test(guardianPhone)) {
    $("editMsg").textContent = "هاتف ولي الأمر يجب أن يكون رقمًا مصريًا صحيحًا من 11 رقمًا.";
    $("editMsg").className = "message error";
    $("editGuardianPhone").focus();
    return;
  }

  const btn = $("saveEditBtn");
  btn.disabled = true;
  btn.textContent = "جاري الحفظ...";
  $("editMsg").textContent = "";

  const { data, error } = await db.rpc("admin_update_student", {
    p_student_id: studentId,
    p_student_number: studentNumber,
    p_name: name,
    p_national_id: nationalId,
    p_student_code: studentCode,
    p_gender: gender,
    p_study_system: studySystem,
    p_class_name: className,
    p_school_file_number: fileNumber,
    p_student_phone: studentPhone,
    p_guardian_name: guardianName,
    p_guardian_phone: guardianPhone,
    p_address: address
  });

  if (error) {
    console.error("admin_update_student:", error);
    $("editMsg").textContent = error.message || "تعذر حفظ التعديلات.";
    $("editMsg").className = "message error";
    btn.disabled = false;
    btn.textContent = "حفظ التعديلات";
    return;
  }

  if (!data || data.success !== true) {
    $("editMsg").textContent = data?.message || "لم يتم حفظ التعديلات.";
    $("editMsg").className = "message error";
    btn.disabled = false;
    btn.textContent = "حفظ التعديلات";
    return;
  }

  $("editMsg").textContent = "تم حفظ التعديلات بنجاح.";
  $("editMsg").className = "message success";
  await load();
  setTimeout(closeEdit, 500);
  btn.disabled = false;
  btn.textContent = "حفظ التعديلات";
});

$("cancelEditBtn").addEventListener("click", closeEdit);
$("editModal").addEventListener("click", event => {
  if (event.target === $("editModal")) closeEdit();
});

async function cancelRegistration(row) {

  const confirmed = confirm(
    `هل تريد إلغاء تسجيل الطالب؟\n\n` +
    `${row.name}\n\n` +
    `سيتم حذف بيانات التسجيل فقط، ولن يتم حذف الطالب من قاعدة البيانات.\n\n` +
    `بعد ذلك يستطيع الطالب التسجيل مرة أخرى.`
  );

  if (!confirmed) return;

  const { data, error } =
    await db.rpc("cancel_student_registration", {
      p_student_id: row.id
    });

  if (error) {
    console.error("cancel_student_registration:", error);

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
    "يمكن للطالب التسجيل مرة أخرى."
  );

  await load();
}

$("rows").addEventListener("click", async event => {

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

  const row = allRows[index];

  if (button.dataset.action === "details") {
    showDetails(row);
    return;
  }

  if (button.dataset.action === "edit") {
    openEdit(row);
    return;
  }

  if (button.dataset.action === "cancel") {
    await cancelRegistration(row);
  }
});

$("closeDetails").addEventListener("click", () => {
  $("detailsModal").classList.add("hidden");
});

$("detailsModal").addEventListener("click", event => {

  if (event.target === $("detailsModal")) {
    $("detailsModal").classList.add("hidden");
  }
});

$("loginForm").addEventListener("submit", async event => {

  event.preventDefault();

  $("loginMsg").textContent =
    "جاري تسجيل الدخول...";

  const email =
    $("email").value.trim();

  const password =
    $("password").value;

  if (!email || !password) {
    $("loginMsg").textContent =
      "اكتب البريد الإلكتروني وكلمة المرور.";
    return;
  }

  const { error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error("Login error:", error);

    $("loginMsg").textContent =
      "بيانات الدخول غير صحيحة.";

    return;
  }

  $("loginMsg").textContent = "";

  show("loginCard", false);
  show("dashboard", true);

  await load();
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  location.reload();
});

$("search").addEventListener("input", render);

$("status").addEventListener("change", render);

$("classFilter").addEventListener("change", render);

$("exportBtn").addEventListener("click", () => {

  const rows = getFilteredRows();

  const headers = [
    "رقم الطالب",
    "الاسم",
    "الكود",
    "نظام الدراسة",
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
      row.study_system || "",
      row.class_name,
      row.school_file_number,
      row.national_id,
      row.student_phone || "",
      row.guardian_name || "",
      row.guardian_phone || "",
      row.address || "",
      row.registered ? "مسجل" : "غير مسجل"
    ])
  ];

  const csv =
    data.map(row =>
      row.map(value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    ).join("\n");

  const blob =
    new Blob(
      ["\ufeff" + csv],
      { type: "text/csv;charset=utf-8" }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = "بيانات_الطلاب.csv";

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
});

(async () => {

  const {
    data: { session }
  } = await db.auth.getSession();

  if (session) {

    show("loginCard", false);
    show("dashboard", true);

    await load();
  }

})();
