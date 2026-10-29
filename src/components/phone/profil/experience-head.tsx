import "@/styles/phone-experience.css";
import Link from "next/link";
import type { ProfileView } from "./data";

type Experience = ProfileView["experiences"][number];

/** The square of an experience: the company's logo, its initials on its colour otherwise. */
export function ExperienceLogo({ item }: { item: Experience }) {
  if (item.logo)
    return (
      <span className="nb-pf-lg" data-logo="" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- a 160 px or 256 px logo */}
        <img src={item.logo} alt="" width={40} height={40} loading="lazy" />
      </span>
    );
  return (
    <span className="nb-pf-lg" style={{ background: item.color }} aria-hidden>
      {item.initials}
    </span>
  );
}

/** « The Growth Lab · Emploi »: the name opens the company's page when it has one. */
export function ExperienceCompany({ item, label }: { item: Experience; label: string }) {
  return (
    <p className="nb-pf-xp-ent">
      {item.href ? (
        <Link href={item.href} aria-label={label}>
          {item.company}
        </Link>
      ) : (
        item.company
      )}{" "}
      · <span style={{ color: item.color }}>{item.type}</span>
    </p>
  );
}

/** « Réalisations clés »: one point per line, with a small diamond of the company's colour. */
export function ExperiencePoints({
  item,
  points,
  title,
}: {
  item: Experience;
  points: string[];
  title: string;
}) {
  if (points.length === 0) return null;
  return (
    <>
      <p className="nb-pf-rk">{title}</p>
      <ul className="nb-pf-pts">
        {points.map((point, n) => (
          <li key={n}>
            <i style={{ background: item.color }} aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
