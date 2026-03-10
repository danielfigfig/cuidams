CREATE OR REPLACE FUNCTION get_email_by_cpf(cpf_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email INTO found_email FROM public.perfis_usuarios WHERE cpf = cpf_input LIMIT 1;
  RETURN found_email;
END;
$$;
