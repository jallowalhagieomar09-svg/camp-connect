CREATE TABLE public.camp_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.camp_participants TO authenticated;
GRANT ALL ON public.camp_participants TO service_role;
ALTER TABLE public.camp_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read participants" ON public.camp_participants FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert participants" ON public.camp_participants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update participants" ON public.camp_participants FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete participants" ON public.camp_participants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE SEQUENCE public.certificate_number_seq START 1;

CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id uuid NOT NULL UNIQUE REFERENCES public.camp_participants(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
GRANT USAGE ON SEQUENCE public.certificate_number_seq TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read certificates" ON public.certificates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.issue_certificate(_participant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing text;
  fresh text;
BEGIN
  SELECT certificate_number INTO existing FROM public.certificates WHERE participant_id = _participant_id;
  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  fresh := 'CFG-2026-' || lpad(nextval('public.certificate_number_seq')::text, 5, '0');
  INSERT INTO public.certificates (participant_id, certificate_number)
  VALUES (_participant_id, fresh)
  ON CONFLICT (participant_id) DO NOTHING;

  SELECT certificate_number INTO existing FROM public.certificates WHERE participant_id = _participant_id;
  RETURN existing;
END;
$$;

INSERT INTO public.camp_participants (full_name, normalized_name)
SELECT DISTINCT ON (lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g')))
  btrim(regexp_replace(btrim(full_name), '\s+', ' ', 'g')),
  lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g'))
FROM public.registrations
WHERE status = 'approved'
ON CONFLICT (normalized_name) DO NOTHING;