-- Insert admin role for the new admin user (replace with actual user_id after creating user)
-- You'll need to run this after creating the user, inserting their actual user_id

-- For now, let's create a helper to make this easier:
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user_id from auth.users by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert admin role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id::text, 'admin')
  ON CONFLICT DO NOTHING;
END;
$$;