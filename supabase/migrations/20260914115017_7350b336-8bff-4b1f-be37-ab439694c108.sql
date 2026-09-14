ALTER TABLE public.camp_participants
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Participant';

DROP TRIGGER IF EXISTS sync_approved_registration_participant ON public.registrations;