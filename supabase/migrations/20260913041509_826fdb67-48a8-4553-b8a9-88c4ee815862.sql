CREATE OR REPLACE FUNCTION public.sync_approved_registration_to_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_name text;
  cleaned_normalized text;
BEGIN
  IF NEW.status = 'approved' THEN
    cleaned_name := btrim(regexp_replace(NEW.full_name, '\s+', ' ', 'g'));
    cleaned_normalized := lower(cleaned_name);

    INSERT INTO public.camp_participants (full_name, normalized_name)
    VALUES (cleaned_name, cleaned_normalized)
    ON CONFLICT (normalized_name) DO UPDATE
      SET full_name = EXCLUDED.full_name;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_approved_registration_participant
AFTER INSERT OR UPDATE OF status, full_name ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.sync_approved_registration_to_participants();