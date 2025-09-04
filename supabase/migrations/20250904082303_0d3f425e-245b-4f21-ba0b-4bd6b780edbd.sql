-- Create admin_secrets table for storing admin authentication data
CREATE TABLE public.admin_secrets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

-- Create policy to prevent any direct access (only edge functions can access)
CREATE POLICY "No direct access to admin secrets" 
ON public.admin_secrets 
FOR ALL 
USING (false);

-- Insert the admin password (for now using the hardcoded value)
INSERT INTO public.admin_secrets (key, value_hash) 
VALUES ('admin_password', 'Admin256');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_secrets_updated_at
BEFORE UPDATE ON public.admin_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();