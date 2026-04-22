-- Add billing fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add invoice fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Sequential invoice numbering
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1001;

-- Invoices storage bucket (public so users can download)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoices
DROP POLICY IF EXISTS "Invoices are publicly readable" ON storage.objects;
CREATE POLICY "Invoices are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Admins manage invoices" ON storage.objects;
CREATE POLICY "Admins manage invoices"
ON storage.objects FOR ALL
USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));