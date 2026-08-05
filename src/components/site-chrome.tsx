import { Link } from "@tanstack/react-router";
import logo from "@/assets/cfg-logo.png.asset.json";
import type { CampSettings } from "@/lib/camp";
import { phoneList } from "@/lib/camp";

const NAV = [
  { label: "About", href: "/#about" },
  { label: "Activities", href: "/#activities" },
  { label: "Fee", href: "/#fee" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <img src={logo.url} alt="Children Foundation The Gambia logo" className="h-11 w-11" />
        <div className="mr-auto leading-tight">
          <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            Children Foundation
          </p>
          <p className="text-sm font-extrabold text-primary">The Gambia (CFG)</p>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-foreground/75 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Link
          to="/register"
          className="ml-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.03]"
        >
          Register
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: CampSettings }) {
  return (
    <footer className="bg-camp-hero mt-24 text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logo.url}
              alt="Children Foundation The Gambia logo"
              className="h-12 w-12 rounded-lg bg-white/95 p-0.5"
            />
            <p className="font-display text-lg font-bold">Children Foundation The Gambia</p>
          </div>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/75">
            {settings.camp_name} — {settings.edition}. {settings.theme}.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-[0.16em] text-accent uppercase">Camp</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>{settings.camp_dates}</li>
            <li>{settings.venue}</li>
            <li>Camp fee: {settings.camp_fee}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-[0.16em] text-accent uppercase">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            {phoneList(settings.contact_phone).map((phone) => (
              <li key={phone}>
                <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
              </li>
            ))}
            <li>
              <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Children Foundation The Gambia (CFG). All rights reserved.
      </div>
    </footer>
  );
}
