import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  MapPin,
  Wallet,
  Phone,
  Mail,
  Users,
  Palette,
  Trophy,
  BookOpen,
  Mic,
  HeartHandshake,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { campSettingsQueryOptions, FALLBACK_SETTINGS, phoneList } from "@/lib/camp";
import logo from "@/assets/cfg-logo.png.asset.json";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(campSettingsQueryOptions),
  head: () => ({
    meta: [
      { title: "CFG Children & Youth Summer Camp — Register Now" },
      {
        name: "description",
        content:
          "Children Foundation The Gambia presents the Children & Youth Summer Camp, 7th Edition. Register online, upload your payment receipt and join us in Kwinella.",
      },
      { property: "og:title", content: "CFG Children & Youth Summer Camp — Register Now" },
      {
        property: "og:description",
        content:
          "7th Edition · 3 - 9 September 2026 · Kwinella Senior Secondary School. Theme: Empowering Youth for Peaceful Democratic Participation.",
      },
    ],
  }),
  component: LandingPage,
});

const ACTIVITIES = [
  {
    icon: Mic,
    title: "Debates & Public Speaking",
    text: "Mock parliament sessions, debates and confidence-building on the microphone.",
  },
  {
    icon: BookOpen,
    title: "Civic & Democracy Classes",
    text: "Interactive lessons on peaceful participation, rights and responsibilities.",
  },
  {
    icon: Palette,
    title: "Arts & Culture",
    text: "Drama, music, drumming and creative arts celebrating Gambian heritage.",
  },
  {
    icon: Trophy,
    title: "Sports & Games",
    text: "Football, athletics and team games that build discipline and friendship.",
  },
  {
    icon: HeartHandshake,
    title: "Life Skills & Mentorship",
    text: "Leadership, teamwork and one-on-one guidance from trained mentors.",
  },
  {
    icon: Users,
    title: "Community Action",
    text: "Group projects where campers give back to the host community.",
  },
];

const FAQS = [
  {
    q: "Who can attend the camp?",
    a: "Children and youth are welcome. Every participant registers with a parent or guardian contact so we can reach a responsible adult throughout the camp.",
  },
  {
    q: "What should my child bring?",
    a: "Comfortable clothing for a week, sports wear, toiletries, a water bottle, bedding and any personal medication. Please label all belongings.",
  },
  {
    q: "Is accommodation and food included?",
    a: "Yes. The camp fee covers accommodation at the venue, meals during the camp week and all camp activities and materials.",
  },
  {
    q: "How do I know my registration is confirmed?",
    a: "After you submit the form your status is “Pending Approval”. Our team verifies your payment receipt and then sends you a confirmation email with the link to the camp WhatsApp group.",
  },
  {
    q: "What if I cannot upload my receipt right now?",
    a: "Please complete payment first, then register with a clear photo or PDF of your receipt. If you have trouble, call one of the numbers in the contact section for help.",
  },
];

function LandingPage() {
  const { data } = useSuspenseQuery(campSettingsQueryOptions);
  const settings = data ?? FALLBACK_SETTINGS;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-camp-hero relative overflow-hidden text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <div className="animate-rise mx-auto mb-6 inline-flex items-center gap-3 rounded-full bg-white/95 px-4 py-2">
            <img src={logo.url} alt="Children Foundation The Gambia logo" className="h-9 w-9" />
            <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              CFG Presents
            </span>
          </div>

          <h1 className="animate-rise font-display text-4xl leading-[0.95] font-black sm:text-6xl md:text-7xl">
            <span className="text-gradient-gold">{settings.camp_name}</span>
          </h1>

          <p className="animate-rise mt-4 inline-block rounded-full bg-white px-4 py-1 text-sm font-extrabold tracking-[0.16em] text-primary uppercase">
            {settings.edition}
          </p>

          <p className="animate-rise mx-auto mt-6 max-w-2xl text-base font-semibold text-primary-foreground/90 sm:text-lg">
            <span className="text-accent">Theme:</span> {settings.theme}
          </p>

          <div className="animate-rise mt-10 grid gap-3 sm:grid-cols-3">
            <HeroFact icon={CalendarDays} label="Date" value={settings.camp_dates} />
            <HeroFact icon={MapPin} label="Venue" value={settings.venue} />
            <HeroFact icon={Wallet} label="Camp fee" value={settings.camp_fee} />
          </div>

          <div className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="w-full rounded-full bg-accent px-8 py-4 text-base font-extrabold text-accent-foreground shadow-[var(--shadow-lift)] transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Register Now
            </Link>
            <a
              href="#about"
              className="w-full rounded-full border border-white/40 px-8 py-4 text-base font-bold text-primary-foreground transition-colors hover:bg-white/10 sm:w-auto"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <Section id="about" eyebrow="About the camp" title="A week of learning, friendship and fun">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card-soft p-6 md:col-span-2">
            <p className="text-[15px] leading-relaxed text-foreground/80">
              Children Foundation The Gambia (CFG) brings together children and youth from across
              the country for the {settings.edition} of the {settings.camp_name}. For one week,
              campers live, learn and play together in a safe, well-supervised environment guided by
              trained facilitators and volunteers.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">
              This year's theme, <strong className="text-primary">{settings.theme}</strong>, puts
              young people at the centre of peaceful civic life. Campers practise dialogue, respect
              for different opinions, leadership and teamwork — skills they carry home to their
              schools and communities.
            </p>
          </div>
          <ul className="card-soft space-y-4 p-6">
            {[
              "Safe, supervised residential camp",
              "Trained facilitators & mentors",
              "Meals and accommodation included",
              "Certificate for every participant",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-sm font-semibold text-foreground/85">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ACTIVITIES */}
      <Section
        id="activities"
        eyebrow="Camp activities"
        title="What campers do during the week"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITIES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="card-soft p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FEE */}
      <Section id="fee" eyebrow="Camp fee & payment" title={`Camp fee: ${settings.camp_fee}`}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-soft bg-primary p-7 text-primary-foreground">
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
              Total per participant
            </p>
            <p className="font-display mt-2 text-5xl font-black text-gradient-gold">
              {settings.camp_fee}
            </p>
            <p className="mt-4 text-sm text-primary-foreground/80">
              Covers accommodation, meals, camp materials, activities and a participation
              certificate for the full camp week.
            </p>
          </div>
          <ol className="card-soft space-y-5 p-7">
            {[
              `Pay the camp fee of ${settings.camp_fee} using the payment details confirmed by the CFG team on the numbers below.`,
              "Keep the receipt or transaction message and take a clear photo, or save it as a PDF.",
              "Complete the online registration form and upload your proof of payment.",
              "Wait for verification — you will receive a confirmation email once approved.",
            ].map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-accent-foreground">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-foreground/80">{step}</p>
              </li>
            ))}
          </ol>
        </div>
        {settings.payment_instructions ? (
          <p className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-5 text-sm font-semibold text-foreground/85">
            {settings.payment_instructions}
          </p>
        ) : null}
        <div className="mt-8 text-center">
          <Link
            to="/register"
            className="inline-block rounded-full bg-primary px-8 py-4 text-base font-extrabold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.03]"
          >
            Start your registration
          </Link>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Frequently asked questions">
        <div className="card-soft px-5 py-2 sm:px-7">
          <Accordion type="single" collapsible>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-left text-base font-bold text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-foreground/75">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CONTACT */}
      <Section id="contact" eyebrow="Contact" title="Talk to the CFG camp team">
        <div className="grid gap-5 sm:grid-cols-2">
          {phoneList(settings.contact_phone).map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="card-soft flex items-center gap-4 p-6 transition-transform hover:-translate-y-1"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Phone className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  Call us
                </span>
                <span className="text-base font-bold text-primary">{phone}</span>
              </span>
            </a>
          ))}
          <a
            href={`mailto:${settings.contact_email}`}
            className="card-soft flex items-center gap-4 p-6 transition-transform hover:-translate-y-1"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Email us
              </span>
              <span className="text-base font-bold break-all text-primary">
                {settings.contact_email}
              </span>
            </span>
          </a>
          <div className="card-soft flex items-center gap-4 p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
                Camp venue
              </span>
              <span className="text-base font-bold text-primary">{settings.venue}</span>
            </span>
          </div>
        </div>
      </Section>

      <SiteFooter settings={settings} />
    </div>
  );
}

function HeroFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur-sm">
      <span className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-accent uppercase">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6 sm:pt-24">
      <p className="text-xs font-bold tracking-[0.2em] text-accent-foreground/70 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 mb-8 text-3xl font-black text-primary sm:text-4xl">{title}</h2>
      {children}
    </section>
  );
}
