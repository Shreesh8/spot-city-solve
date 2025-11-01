-- Assign admin role to pjupu8vgc@gmail.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('aKx3mCUkuWflf7HcuvAuwff1hp73', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;