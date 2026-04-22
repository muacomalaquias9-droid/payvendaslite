CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service-role (no auth.uid) OR admin users
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem gerar facturas';
  END IF;
  RETURN nextval('public.invoice_seq');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO service_role;