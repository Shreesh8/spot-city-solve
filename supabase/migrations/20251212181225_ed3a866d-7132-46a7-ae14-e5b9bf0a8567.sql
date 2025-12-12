-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow selects for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow updates for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow inserts for all users" ON public.profiles;

-- Create secure SELECT policy: Users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid()::text = user_id OR has_role(auth.uid(), 'admin'));

-- Create secure UPDATE policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid()::text = user_id);

-- Create secure INSERT policy: Users can only create their own profile
CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);