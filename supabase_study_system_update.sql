-- نظام الدراسة + السماح بتساوي هاتف الطالب وولي الأمر
-- شغّل هذا الملف كاملًا مرة واحدة في Supabase SQL Editor

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS study_system text;

ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_study_system_check;

ALTER TABLE public.students
ADD CONSTRAINT students_study_system_check
CHECK (
  study_system IS NULL
  OR study_system IN ('بكالوريا', 'ثانوية عامة')
);

-- دالة التسجيل الجديدة: تضيف نظام الدراسة
DROP FUNCTION IF EXISTS public.register_student(bigint, text, text, text);
DROP FUNCTION IF EXISTS public.register_student(bigint, text, text, text, text);
DROP FUNCTION IF EXISTS public.register_student(bigint, text, text, text, text, text);

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
  IF p_study_system IS NULL
     OR trim(p_study_system) NOT IN ('بكالوريا', 'ثانوية عامة') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'من فضلك اختر نظام الدراسة'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.registrations
    WHERE student_id = p_student_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'الطالب مسجل بالفعل'
    );
  END IF;

  INSERT INTO public.students (id, study_system)
  VALUES (p_student_id, trim(p_study_system))
  ON CONFLICT (id) DO UPDATE
  SET study_system = EXCLUDED.study_system;

  INSERT INTO public.registrations (
    student_id,
    student_phone,
    guardian_name,
    guardian_phone,
    address
  )
  VALUES (
    p_student_id,
    trim(p_student_phone),
    trim(p_guardian_name),
    trim(p_guardian_phone),
    trim(p_address)
  )
  RETURNING id INTO v_registration_id;

  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_student(
  bigint,
  text,
  text,
  text,
  text,
  text
) TO anon, authenticated;

-- دالة تعديل بيانات الطالب مع نظام الدراسة
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
  text
);

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

  IF v_registration_exists THEN
    UPDATE public.registrations
    SET
      student_phone = trim(p_student_phone),
      guardian_name = trim(p_guardian_name),
      guardian_phone = trim(p_guardian_phone),
      address = trim(p_address)
    WHERE student_id = p_student_id;
  ELSE
    INSERT INTO public.registrations (
      student_id,
      student_phone,
      guardian_name,
      guardian_phone,
      address
    )
    VALUES (
      p_student_id,
      trim(p_student_phone),
      trim(p_guardian_name),
      trim(p_guardian_phone),
      trim(p_address)
    );
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
) TO authenticated;
