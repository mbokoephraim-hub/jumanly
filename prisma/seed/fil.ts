/**
 * The Fil of the demo (Modèle B, lot B3, planche `Fil.dc.html`): four fictional talents, the
 * posts of Baobab Fintech and Mwinda Énergie, a few answers, and what Grâce (grace.ux@) follows.
 * Local and preview only; every person, post and photo here is invented.
 */
import { hashPassword } from "better-auth/crypto";
import { DEMO_PASSWORD } from "./accounts";
import type { SeedClient } from "./client";

const people = [
  {
    key: "amani",
    email: "amani.fil@jumanly.test",
    firstName: "Amani",
    lastName: "Kasongo",
    city: "Lubumbashi",
    headline: "Étudiante en gestion",
    experience: null,
  },
  {
    key: "patrick",
    email: "patrick.fil@jumanly.test",
    firstName: "Patrick",
    lastName: "Ilunga",
    city: "Kinshasa",
    headline: "Analyste crédit",
    experience: { title: "Analyste crédit", company: "Fleuve Banque (fictive)" },
  },
  {
    key: "sarah",
    email: "sarah.fil@jumanly.test",
    firstName: "Sarah",
    lastName: "Mbala",
    city: "Kinshasa",
    headline: "Étudiante en design graphique",
    experience: null,
  },
  {
    key: "joel",
    email: "joel.fil@jumanly.test",
    firstName: "Joël",
    lastName: "Kabeya",
    city: "Kinshasa",
    headline: "Community manager",
    experience: null,
  },
] as const;

type Key = (typeof people)[number]["key"] | "baobab" | "mwinda" | "fleuve";

const HOUR = 3_600_000;

export async function seedFeed(db: SeedClient) {
  const grace = await db.user.findUnique({
    where: { email: "grace.ux@jumanly.test" },
    select: { id: true },
  });
  const orgs = await db.organization.findMany({
    where: {
      slug: {
        in: ["ux-baobab-fintech-fictive", "ux-mwinda-energie-fictive", "ux-fleuve-banque-fictive"],
      },
    },
    select: { id: true, slug: true },
  });
  const org = (slug: string) => orgs.find((row) => row.slug === slug)?.id;
  const baobab = org("ux-baobab-fintech-fictive");
  const mwinda = org("ux-mwinda-energie-fictive");
  const fleuve = org("ux-fleuve-banque-fictive");
  if (!grace || !baobab || !mwinda || !fleuve) return;
  const job = await db.job.findUnique({
    where: { slug: "ux-analyste-donnees-junior-kinshasa" },
    select: { id: true },
  });

  const password = await hashPassword(DEMO_PASSWORD);
  const now = new Date();
  const ids: Record<string, string> = {};
  for (const person of people) {
    const data = {
      name: `${person.firstName} ${person.lastName}`,
      firstName: person.firstName,
      lastName: person.lastName,
      emailVerified: true,
      country: "CD",
      city: person.city,
      termsAcceptedAt: now,
    };
    const user = await db.user.upsert({
      where: { email: person.email },
      update: data,
      create: { email: person.email, ...data },
    });
    await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
    await db.account.create({
      data: { userId: user.id, accountId: user.id, providerId: "credential", password },
    });
    const profile = await db.talentProfile.upsert({
      where: { userId: user.id },
      update: { headline: person.headline, visibility: "recruiters" },
      create: { userId: user.id, headline: person.headline, visibility: "recruiters" },
    });
    await db.experience.deleteMany({ where: { profileId: profile.id } });
    if (person.experience) {
      await db.experience.create({
        data: {
          profileId: profile.id,
          ...person.experience,
          startDate: new Date(now.getTime() - 21 * 24 * HOUR),
          description: "Expérience de démonstration.",
        },
      });
    }
    ids[person.key] = user.id;
  }

  // Patrick's profile as the mockup shows it (docs/profil-personne): handle, networks, field,
  // contract sought, languages, experiences with their points and skills. All invented.
  const patrick = await db.talentProfile.findUnique({
    where: { userId: ids.patrick! },
    select: { id: true },
  });
  if (patrick) {
    await db.talentProfile.update({
      where: { id: patrick.id },
      data: {
        handle: "patrick.ilunga",
        socialLinks: {
          linkedin: "https://www.linkedin.com/in/patrick-ilunga-fictif",
          instagram: "https://www.instagram.com/patrick.ilunga.fictif",
          x: "https://x.com/patrick_fictif",
          facebook: "https://www.facebook.com/patrick.ilunga.fictif",
        },
        showEmail: true,
        summary:
          "Analyste crédit chez Fleuve Banque (fictive). J’aide les PME de Kinshasa à obtenir leur premier prêt, chiffres à l’appui.",
        sectors: ["Finance et banque"],
        desiredContracts: ["cdi"],
        languages: [
          { code: "fr", level: "fluent" },
          { code: "ln", level: "native" },
          { code: "en", level: "intermediate" },
        ],
      },
    });
    await db.experience.deleteMany({ where: { profileId: patrick.id } });
    const month = (year: number, index: number) => new Date(Date.UTC(year, index, 1));
    await db.experience.createMany({
      data: [
        {
          profileId: patrick.id,
          title: "Analyste crédit",
          company: "Fleuve Banque (fictive)",
          location: "Kinshasa",
          startDate: month(2024, 0),
          description: [
            "Étudie environ 25 dossiers de crédit PME par mois",
            "A construit le tableau de bord des impayés sous Power BI",
            "Présente les dossiers au comité de crédit chaque semaine",
            "Forme deux stagiaires à la lecture des bilans",
          ].join("\n"),
        },
        {
          profileId: patrick.id,
          title: "Chargé de clientèle junior",
          company: "Baobab Fintech (fictive)",
          location: "Kinshasa",
          startDate: month(2022, 8),
          endDate: month(2023, 11),
          description: [
            "Suivait un portefeuille de 180 clients particuliers",
            "Ouvrait les comptes mobiles et conseillait sur l’épargne",
            "A réduit les retards de paiement grâce à des relances ciblées",
          ].join("\n"),
        },
        {
          profileId: patrick.id,
          title: "Stagiaire en audit",
          company: "Cabinet Lukusa & Associés (fictif)",
          type: "internship",
          location: "Kinshasa",
          startDate: month(2022, 1),
          endDate: month(2022, 6),
          description: [
            "Préparait les feuilles de travail des missions d’audit",
            "Vérifiait les rapprochements bancaires de trois clients",
          ].join("\n"),
        },
      ],
    });
    const skills = await db.skill.findMany({
      where: { name: { in: ["Analyse financière", "Excel", "Power BI", "SQL", "Négociation"] } },
      select: { id: true, name: true },
    });
    for (const skill of skills)
      await db.profileSkill.upsert({
        where: { profileId_skillId: { profileId: patrick.id, skillId: skill.id } },
        update: {},
        create: {
          profileId: patrick.id,
          skillId: skill.id,
          verified: skill.name === "Analyse financière" || skill.name === "Excel",
        },
      });
  }

  // Start again from a clean state: these posts only exist for the demo.
  const authors = Object.values(ids);
  await db.feedPost.deleteMany({
    where: {
      OR: [
        { authorId: { in: authors } },
        { organizationId: { in: [baobab, mwinda, fleuve] } },
        { authorId: grace.id },
      ],
    },
  });
  await db.feedFollow.deleteMany({ where: { followerId: grace.id } });
  await db.feedHiddenType.deleteMany({ where: { userId: grace.id } });

  const by = (key: Key) =>
    key === "baobab"
      ? { organizationId: baobab }
      : key === "mwinda"
        ? { organizationId: mwinda }
        : key === "fleuve"
          ? { organizationId: fleuve }
          : { authorId: ids[key]! };
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR);

  // The next Tuesday at 10 h, for the open day of Mwinda Énergie.
  const eventAt = new Date(now);
  eventAt.setUTCDate(eventAt.getUTCDate() + ((2 - eventAt.getUTCDay() + 7) % 7 || 7));
  eventAt.setUTCHours(9, 0, 0, 0);
  const eventDay = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Kinshasa",
  }).format(eventAt);

  const posts: {
    author: Key;
    hours: number;
    kind?: "newRole" | "work" | "event";
    /** docs/fil-menu-publication § 2: a hook line of 60 characters at most. */
    title: string;
    body: string;
    image?: [string, string];
    job?: boolean;
    eventAt?: Date;
    replies: [Key, number, string][];
  }[] = [
    {
      author: "baobab",
      hours: 2,
      title: "Nous recrutons 3 analystes data à Kinshasa",
      body: "On recrute trois analystes data à Kinshasa. Candidature en 5 minutes.",
      job: true,
      replies: [
        ["joel", 1.2, "Le poste est ouvert aux débutants ?"],
        ["baobab", 1, "Oui : deux ans d’expérience au plus, les stages comptent."],
        ["amani", 0.7, "Partagé à ma promo !"],
      ],
    },
    {
      author: "amani",
      hours: 3,
      title: "Mon premier badge sur Jumanly",
      body: "Badge « Bâtisseuse de communauté » obtenu ! Merci à toutes les personnes qui ont répondu à mes questions sur Jumanly.",
      image: [
        "/modele-b/fil-amani.jpg",
        "Amani sourit, son téléphone à la main, une notification de badge à l’écran.",
      ],
      replies: [
        ["sarah", 2.2, "Bravo Amani, c’est mérité !"],
        ["joel", 2, "Tu réponds toujours en premier, normal."],
      ],
    },
    {
      author: "patrick",
      hours: 5,
      title: "Premier jour chez Fleuve Banque",
      kind: "newRole",
      body: "Premier jour chez Fleuve Banque comme analyste crédit. Offre trouvée sur Jumanly il y a trois semaines.",
      image: ["/modele-b/fil-patrick.jpg", "Patrick rit, assis à son bureau."],
      replies: [
        ["fleuve", 4.2, "Bienvenue dans l’équipe, Patrick !"],
        ["joel", 4, "Bravo frère, tu le mérites. Tu as postulé comment ?"],
        ["patrick", 3, "Profil complété à 100 %, puis Orbi m’a aidé à adapter mon CV à l’offre."],
        ["amani", 2, "Ça motive ! Félicitations."],
        ["patrick", 1, "@Grâce Mbuyi regarde l’offre de Baobab Fintech, elle est faite pour toi."],
      ],
    },
    {
      author: "sarah",
      hours: 8,
      title: "Ma bannière pour une marque en ligne",
      kind: "work",
      body: "Ma bannière pour une marque de courses en ligne, projet d’école. Vos avis m’intéressent !",
      image: [
        "/modele-b/fil-sarah.jpg",
        "Bannière d’une marque de courses en ligne avec un personnage illustré.",
      ],
      replies: [
        ["joel", 6, "Les couleurs sont bien choisies. Le texte pourrait être plus gros."],
        ["amani", 5, "J’adore le personnage !"],
      ],
    },
    {
      author: "mwinda",
      hours: 20,
      title: "Portes ouvertes chez Mwinda Énergie",
      kind: "event",
      body: `Portes ouvertes ${eventDay}, 10 h, à Gombe. Venez rencontrer l’équipe solaire et déposer votre CV sur place.`,
      eventAt,
      replies: [
        ["patrick", 19, "Je viens avec deux amis de promo."],
        ["mwinda", 18, "Avec plaisir, l’entrée est libre."],
      ],
    },
    {
      author: "joel",
      hours: 30,
      title: "275 abonnés en une semaine",
      kind: "work",
      body: "Ma campagne pour Baobab Fintech : 275 nouveaux abonnés en une semaine. Je cherche un poste de community manager à Kinshasa.",
      image: ["/modele-b/fil-joel.jpg", "Visuel de campagne : 275 nouveaux abonnés."],
      replies: [
        ["sarah", 26, "275 en une semaine, chapeau !"],
        ["patrick", 25, "Je te recommande à l’équipe communication de Fleuve Banque."],
      ],
    },
  ];

  const talents = Object.values(ids);
  for (const post of posts) {
    const created = await db.feedPost.create({
      data: {
        ...by(post.author),
        kind: post.kind ?? "post",
        title: post.title,
        body: post.body,
        imageUrl: post.image?.[0] ?? null,
        imageAlt: post.image?.[1] ?? null,
        jobId: post.job ? (job?.id ?? null) : null,
        eventAt: post.eventAt ?? null,
        createdAt: ago(post.hours),
      },
    });
    for (const [author, hours, body] of post.replies) {
      await db.feedPost.create({
        data: { ...by(author), parentId: created.id, body, createdAt: ago(hours) },
      });
    }
    // A few likes and reposts from the other demo talents of the Fil.
    const others = talents.filter((id) => id !== ids[post.author as string]);
    await db.feedLike.createMany({
      data: others.map((userId) => ({ postId: created.id, userId })),
    });
    await db.feedRepost.createMany({
      data: others.slice(0, 1).map((userId) => ({ postId: created.id, userId })),
    });
    if (post.eventAt) {
      await db.feedEventParticipant.createMany({
        data: others.map((userId) => ({ postId: created.id, userId })),
      });
    }
  }

  // Grâce follows Amani and Baobab Fintech: « Abonnements » is not empty.
  await db.feedFollow.createMany({
    data: [
      { followerId: grace.id, userId: ids.amani! },
      { followerId: grace.id, organizationId: baobab },
    ],
  });
}
