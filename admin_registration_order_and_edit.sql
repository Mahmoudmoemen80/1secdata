-- =========================================
-- تعديل لوحة الإدارة:
-- 1) تعديل بيانات الطالب بدون إجبار الإدارة
--    على استكمال بيانات التسجيل.
-- 2) ترتيب الطلاب المسجلين حسب تاريخ التسجيل
--    من الأحدث إلى الأقدم.
-- =========================================

DROP FUNCTION IF EXISTS public.admin_student_list();

CREATE FUNCTION public.admin_student_list()
RETURNS TABLE (
  id bigint,
  student_number integer,
  name text,
  student_code text,
  gender text,
  study_system text,
  class_name text,
  school_file_number text,
  national_id text,
  student_phone text,
  guardian_name text,
  guardian_phone text,
  address text,
  registered boolean,
  registered_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    s.id,
    s.student_number,
    s.name,
    s.student_code,
    s.gender,
    s.study_system,
    s.class_name,
    s.school_file_number,
    s.national_id,
    r.student_phone,
    r.guardian_name,
    r.guardian_phone,
    r.address,
    (r.id IS NOT NULL),
    r.registered_at
  FROM public.students AS s
  LEFT JOIN public.registrations AS r
    ON r.student_id = s.id
  ORDER BY
    r.registered_at DESC NULLS LAST,
    r.id DESC NULLS LAST,
    s.student_number;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_student_list()
TO authenticated;


DROP FUNCTION IF EXISTS public.admin_update_student(
  bigint,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
);

CREATE FUNCTION public.admin_update_student(
  p_student_id bigint,
  p_student_number integer,
  p_name text,
  p_national_id text,
  p_student_code text,
  p_gender text,
  p_study_system text,
  p_class_name text,
  p_school_file_number text,
  p_student_phone text,
  p_guardian_name text,
  p_guardian_phone text,
  p_address text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_registration_exists boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.students
    WHERE id = p_student_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الطالب غير موجود'
    );
  END IF;

  IF trim(coalesce(p_name, '')) !~ '^[A-Za-zء-ي ]+$'
     OR trim(p_name) = '' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'اسم الطالب يجب أن يحتوي على حروف فقط'
    );
  END IF;

  IF trim(coalesce(p_national_id, '')) !~ '^[0-9]{14}$' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الرقم القومي يجب أن يتكون من 14 رقمًا'
    );
  END IF;

  IF p_study_system IS NULL
     OR trim(p_study_system) NOT IN ('بكالوريا', 'ثانوية عامة') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'من فضلك اختر نظام الدراسة'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.students
    WHERE trim(national_id) = trim(p_national_id)
      AND id <> p_student_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الرقم القومي مستخدم بالفعل لطالب آخر'
    );
  END IF;

  IF NULLIF(trim(coalesce(p_student_phone, '')), '') IS NOT NULL
     AND trim(p_student_phone) !~ '^01[0125][0-9]{8}$' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'هاتف الطالب يجب أن يكون رقمًا مصريًا صحيحًا من 11 رقمًا'
    );
  END IF;

  IF NULLIF(trim(coalesce(p_guardian_name, '')), '') IS NOT NULL
     AND trim(p_guardian_name) !~ '^[A-Za-zء-ي ]+$' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'اسم ولي الأمر يجب أن يحتوي على حروف فقط'
    );
  END IF;

  IF NULLIF(trim(coalesce(p_guardian_phone, '')), '') IS NOT NULL
     AND trim(p_guardian_phone) !~ '^01[0125][0-9]{8}$' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'هاتف ولي الأمر يجب أن يكون رقمًا مصريًا صحيحًا من 11 رقمًا'
    );
  END IF;

  UPDATE public.students
  SET
    student_number = p_student_number,
    name = trim(p_name),
    national_id = trim(p_national_id),
    student_code = trim(p_student_code),
    gender = trim(p_gender),
    study_system = trim(p_study_system),
    class_name = trim(p_class_name),
    school_file_number = trim(p_school_file_number)
  WHERE id = p_student_id;

  SELECT EXISTS (
    SELECT 1
    FROM public.registrations
    WHERE student_id = p_student_id
  )
  INTO v_registration_exists;

  -- إذا كان الطالب مسجلًا، حدّث بيانات التسجيل.
  -- وإذا لم يكن مسجلًا، لا ننشئ تسجيلًا ناقصًا لمجرد تعديل
  -- بيانات الطالب الأساسية من لوحة الإدارة.
  IF v_registration_exists THEN
    UPDATE public.registrations
    SET
      student_phone = NULLIF(trim(coalesce(p_student_phone, '')), ''),
      guardian_name = NULLIF(trim(coalesce(p_guardian_name, '')), ''),
      guardian_phone = NULLIF(trim(coalesce(p_guardian_phone, '')), ''),
      address = NULLIF(trim(coalesce(p_address, '')), '')
    WHERE student_id = p_student_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'تم تعديل بيانات الطالب وحفظها بنجاح'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_student(
  bigint,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
)
TO authenticated;
