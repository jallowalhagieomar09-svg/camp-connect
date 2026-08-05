CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.camp_settings (
  id integer PRIMARY KEY DEFAULT 1,
  camp_name text NOT NULL,
  theme text NOT NULL,
  edition text NOT NULL,
  camp_dates text NOT NULL,
  venue text NOT NULL,
  camp_fee text NOT NULL,
  whatsapp_link text NOT NULL DEFAULT '',
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  payment_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT camp_settings_single_row CHECK (id = 1)
);
GRANT SELECT ON public.camp_settings TO anon;
GRANT SELECT, UPDATE ON public.camp_settings TO authenticated;
GRANT ALL ON public.camp_settings TO service_role;
ALTER TABLE public.camp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Camp settings are public" ON public.camp_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update camp settings" ON public.camp_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.camp_settings (id, camp_name, theme, edition, camp_dates, venue, camp_fee, whatsapp_link, contact_phone, contact_email, payment_instructions)
VALUES (
  1,
  'Children & Youth Summer Camp',
  'Empowering Youth for Peaceful Democratic Participation',
  '7th Edition',
  '3 - 9 September 2026',
  'Kwinella Senior Secondary School',
  'D1000',
  '',
  '+220 392 8131 / +220 259 9852 / +220 360 7188',
  'info@childrenfoundationgambia.org',
  'Pay the camp fee of D1000 to Children Foundation The Gambia (CFG) by mobile money or bank transfer, then upload a clear photo or PDF of your payment receipt in the registration form.'
);

CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  school text NOT NULL,
  guardian_name text NOT NULL,
  guardian_phone text NOT NULL,
  email text NOT NULL,
  home_address text NOT NULL,
  emergency_contact text NOT NULL,
  receipt_path text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT INSERT ON public.registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a registration" ON public.registrations FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Admins can read registrations" ON public.registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete registrations" ON public.registrations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));