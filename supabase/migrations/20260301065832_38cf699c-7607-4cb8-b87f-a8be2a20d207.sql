
-- Drop the broken trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_admin ON public.profiles;

-- Recreate function to work with profiles table (lookup email from auth.users)
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email TEXT;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
  
  IF _email IN ('isaacmuaco582@gmail.com', 'derivaldokiala@gmail.com', 'isaacmilagre9@gmail.com', 'apkmanus@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate trigger on profiles
CREATE TRIGGER trigger_auto_assign_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();
