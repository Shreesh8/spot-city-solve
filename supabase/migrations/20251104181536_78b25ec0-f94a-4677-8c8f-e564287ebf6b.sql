-- Create issues table
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  location_latitude double precision NOT NULL,
  location_longitude double precision NOT NULL,
  location_address text,
  photos text[] DEFAULT '{}',
  reporter_id text NOT NULL,
  reporter_name text NOT NULL,
  reporter_email text,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view public issues
CREATE POLICY "Anyone can view public issues"
ON public.issues
FOR SELECT
USING (is_public = true);

-- Allow authenticated users to view all issues (for admins and reporters)
CREATE POLICY "Authenticated users can view all issues"
ON public.issues
FOR SELECT
TO authenticated
USING (true);

-- Allow users to create their own issues
CREATE POLICY "Users can create issues"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own issues
CREATE POLICY "Users can update their own issues"
ON public.issues
FOR UPDATE
TO authenticated
USING (reporter_id = auth.uid()::text);

-- Allow admins to update any issue
CREATE POLICY "Admins can update any issue"
ON public.issues
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()::text 
    AND role = 'admin'
  )
);

-- Allow users to delete their own issues
CREATE POLICY "Users can delete their own issues"
ON public.issues
FOR DELETE
TO authenticated
USING (reporter_id = auth.uid()::text);

-- Allow admins to delete any issue
CREATE POLICY "Admins can delete any issue"
ON public.issues
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()::text 
    AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_issues_updated_at
BEFORE UPDATE ON public.issues
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();