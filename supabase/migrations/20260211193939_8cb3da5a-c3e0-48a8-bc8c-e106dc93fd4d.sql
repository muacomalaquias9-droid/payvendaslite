
-- Auto-activate wallet for all new users
-- Update existing profiles to have wallet_activated = true
UPDATE public.profiles SET wallet_activated = true, wallet_activation_date = now() WHERE wallet_activated = false OR wallet_activated IS NULL;

-- Change default for wallet_activated to true
ALTER TABLE public.profiles ALTER COLUMN wallet_activated SET DEFAULT true;

-- Create trigger to auto-add admin role for specific emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
  
  IF _email IN ('isaacmuaco582@gmail.com', 'derivaldokiala@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles insert
DROP TRIGGER IF EXISTS trigger_auto_assign_admin ON public.profiles;
CREATE TRIGGER trigger_auto_assign_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();
