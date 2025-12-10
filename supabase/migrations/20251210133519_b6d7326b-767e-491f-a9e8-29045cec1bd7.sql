-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can view all issues" ON issues;
DROP POLICY IF EXISTS "Users can create issues" ON issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON issues;
DROP POLICY IF EXISTS "Admins can update any issue" ON issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON issues;
DROP POLICY IF EXISTS "Admins can delete any issue" ON issues;
DROP POLICY IF EXISTS "Authenticated users can view all issue details" ON issues;
DROP POLICY IF EXISTS "Anonymous users cannot view issues table" ON issues;

-- Create proper PERMISSIVE policies
CREATE POLICY "Authenticated users can view all issues"
ON issues FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create issues"
ON issues FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own issues"
ON issues FOR UPDATE
TO authenticated
USING (reporter_id = (auth.uid())::text);

CREATE POLICY "Admins can update any issue"
ON issues FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own issues"
ON issues FOR DELETE
TO authenticated
USING (reporter_id = (auth.uid())::text);

CREATE POLICY "Admins can delete any issue"
ON issues FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));