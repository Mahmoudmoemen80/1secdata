-- 1secdata: final registration timestamp + admin ordering/edit behavior
-- Run once in Supabase SQL Editor.

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.registrations
ALTER COLUMN created_at SET DEFAULT now();

-- Existing registrations did not have a reliable historical timestamp.
-- Populate missing values with the migration time so they are not blank.
UPDATE public.registrations
SET created_at = now()
WHERE created_at IS NULL;

-- Registration function: stores study system and timestamp automatically.
DROP FUNCTION IF EXISTS public.register_student(
  bigint, text, text, text, text, text
);

CREATE FUNCTION public.register_student(
  p_student_id bigint,
  p_student_phone text,
  p_study_system text,
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
  v_registration_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.students WHERE id = p_student_id
  ) THEN
    RETURN json_build_object('success', false, 'message', 'الطالب غير موجود');
  END IF;

  IF p_study_system IS NULL
     OR trim(p_study_system) NOT IN ('بكالوريا', 'ثانوية عامة') THEN
    RETURN json_build_object('success', false, 'message', 'من فضلك اختر نظام الدراسة');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.registrations WHERE student_id = p_student_id
  ) THEN
    RETURN json_build_object('success', false, 'message', 'الطالب مسجل بالفعل');
  END IF;

  UPDATE public.students
  SET study_system = trim(p_study_system)
  WHERE id = p_student_id;

  INSERT INTO public.registrations (
    student_id,
    student_phone,
    guardian_name,
    guardian_phone,
    address,
    created_at
  )
  VALUES (
    p_student_id,
    trim(p_student_phone),
    trim(p_guardian_name),
    trim(p_guardian_phone),
    trim(p_address),
    now()
  )
  RETURNING id INTO v_registration_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_student(
  bigint, text, text, text, text, text
) TO anon, authenticated;

-- Admin list: newest registered first; unregistered students last.
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
    r.created_at
  FROM public.students AS s
  LEFT JOIN public.registrations AS r
    ON r.student_id = s.id
  ORDER BY
    CASE WHEN r.id IS NULL THEN 1 ELSE 0 END,
    r.created_at DESC NULLS LAST,
    r.id DESC,
    s.student_number;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_student_list() TO authenticated;

-- Admin edit: update the master student record and, only if a registration
-- already exists, update registration data. It does NOT create a new
-- registration, so editing an unregistered student never asks for completion.
DROP FUNCTION IF EXISTS public.admin_update_student(
  bigint, integer, text, text, text, text, text, text, text, text, text, text, text
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
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN json_build_object('success', false, 'message', 'الطالب غير موجود');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.students
    WHERE trim(national_id) = trim(p_national_id) AND id <> p_student_id
  ) THEN
    RETURN json_build_object('success', false, 'message', 'الرقم القومي مستخدم بالفعل لطالب آخر');
  END IF;

  IF p_study_system IS NOT NULL
     AND trim(p_study_system) NOT IN ('بكالوريا', 'ثانوية عامة') THEN
    RETURN json_build_object('success', false, 'message', 'نظام الدراسة غير صحيح');
  END IF;

  UPDATE public.students
  SET
    student_number = p_student_number,
    name = trim(p_name),
    national_id = trim(p_national_id),
    student_code = trim(p_student_code),
    gender = trim(p_gender),
    study_system = NULLIF(trim(p_study_system), ''),
    class_name = trim(p_class_name),
    school_file_number = trim(p_school_file_number)
  WHERE id = p_student_id;

  SELECT EXISTS (
    SELECT 1 FROM public.registrations WHERE student_id = p_student_id
  ) INTO v_registration_exists;

  IF v_registration_exists THEN
    UPDATE public.registrations
    SET
      student_phone = NULLIF(trim(p_student_phone), ''),
      guardian_name = NULLIF(trim(p_guardian_name), ''),
      guardian_phone = NULLIF(trim(p_guardian_phone), ''),
      address = NULLIF(trim(p_address), '')
    WHERE student_id = p_student_id;
  END IF;

  RETURN json_build_object('success', true, 'message', 'تم تعديل بيانات الطالب وحفظها بنجاح');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_student(
  bigint, integer, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;
