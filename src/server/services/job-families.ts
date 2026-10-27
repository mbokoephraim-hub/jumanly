/**
 * Job families: the key skills of a métier, so the diagnostic asks first about what the target
 * job really needs (a social media manager is asked about content, not SQL). Reference data, like
 * the skills seed: the names are those of `prisma/seed/skills.ts`.
 */

type Family = { keywords: string[]; skills: string[] };

const families: Family[] = [
  {
    keywords: [
      "social media",
      "community manager",
      "community management",
      "reseaux sociaux",
      "influence",
      "content manager",
    ],
    skills: [
      "Création de contenu digital",
      "Gestion des réseaux sociaux",
      "Planification éditoriale",
      "Analyse des performances",
      "Copywriting",
    ],
  },
  {
    keywords: [
      "marketing digital",
      "digital marketing",
      "webmarketing",
      "web marketing",
      "growth",
      "seo",
      "sea",
      "acquisition",
      "e commerce",
      "ecommerce",
    ],
    skills: [
      "Marketing digital",
      "Création de contenu digital",
      "Référencement naturel",
      "Publicité en ligne",
      "Analyse des performances",
    ],
  },
  {
    keywords: ["marketing", "marque", "brand", "chef de produit", "product marketing"],
    skills: [
      "Marketing",
      "Étude de marché",
      "Stratégie de communication",
      "Image de marque",
      "Analyse des performances",
    ],
  },
  {
    keywords: [
      "communication",
      "relations presse",
      "relations publiques",
      "attache de presse",
      "evenementiel",
    ],
    skills: [
      "Stratégie de communication",
      "Rédaction professionnelle",
      "Création de contenu digital",
      "Relations presse",
      "Événementiel",
    ],
  },
  {
    keywords: ["redacteur", "redactrice", "copywriter", "journaliste", "journalisme", "contenu"],
    skills: [
      "Rédaction web",
      "Copywriting",
      "Storytelling",
      "Relecture et correction",
      "Journalisme",
    ],
  },
  {
    keywords: [
      "graphiste",
      "graphisme",
      "infographiste",
      "designer graphique",
      "directeur artistique",
    ],
    skills: ["Graphisme", "Adobe Photoshop", "Adobe Illustrator", "Canva", "Image de marque"],
  },
  {
    keywords: ["ux", "ui", "product designer", "designer ux", "designer ui", "web designer"],
    skills: ["UX design", "UI design", "Figma", "Créativité", "Méthodes agiles"],
  },
  {
    keywords: [
      "video",
      "videaste",
      "monteur",
      "monteuse",
      "audiovisuel",
      "photographe",
      "realisateur",
    ],
    skills: [
      "Montage vidéo",
      "Production audiovisuelle",
      "Photographie",
      "Storytelling",
      "Création de contenu digital",
    ],
  },
  {
    keywords: ["mobile", "android", "ios", "flutter"],
    skills: ["Développement mobile", "Flutter", "API REST", "Git", "Tests logiciels"],
  },
  {
    keywords: [
      "developpeur",
      "developpeuse",
      "developer",
      "programmeur",
      "frontend",
      "front end",
      "backend",
      "back end",
      "fullstack",
      "full stack",
      "web",
      "logiciel",
      "software",
    ],
    skills: ["Développement web", "JavaScript", "HTML", "Git", "API REST"],
  },
  {
    keywords: [
      "data",
      "donnees",
      "business intelligence",
      "bi",
      "statisticien",
      "statisticienne",
      "statistique",
    ],
    skills: ["Analyse de données", "Excel", "SQL", "Power BI", "Visualisation de données"],
  },
  {
    keywords: [
      "informatique",
      "reseau",
      "systemes",
      "helpdesk",
      "support it",
      "technicien it",
      "cybersecurite",
      "devops",
    ],
    skills: [
      "Support informatique",
      "Maintenance informatique",
      "Administration réseau",
      "Cybersécurité",
      "Linux",
    ],
  },
  {
    keywords: [
      "comptable",
      "comptabilite",
      "finance",
      "financier",
      "financiere",
      "auditeur",
      "auditrice",
      "audit",
      "tresorier",
      "controleur de gestion",
      "fiscaliste",
    ],
    skills: ["Comptabilité générale", "SYSCOHADA", "États financiers", "Fiscalité", "Excel"],
  },
  {
    keywords: [
      "service client",
      "conseiller client",
      "conseillere client",
      "teleconseiller",
      "teleconseillere",
      "call center",
      "centre d appel",
      "relation client",
    ],
    skills: [
      "Relation client",
      "Écoute active",
      "Gestion des réclamations",
      "Téléconseil",
      "Communication orale",
    ],
  },
  {
    keywords: [
      "commercial",
      "commerciale",
      "vente",
      "vendeur",
      "vendeuse",
      "sales",
      "business developer",
      "account manager",
    ],
    skills: [
      "Prospection commerciale",
      "Négociation commerciale",
      "Relation client",
      "Vente B2B",
      "Gestion d'un portefeuille clients",
    ],
  },
  {
    keywords: [
      "ressources humaines",
      "rh",
      "recruteur",
      "recruteuse",
      "recrutement",
      "talent acquisition",
      "paie",
    ],
    skills: [
      "Recrutement",
      "Conduite d'entretiens",
      "Gestion administrative du personnel",
      "Droit du travail",
      "Paie",
    ],
  },
  {
    keywords: ["suivi evaluation", "m e", "humanitaire", "ong", "developpement international"],
    skills: [
      "Suivi-évaluation",
      "Cadre logique",
      "Gestion de projets humanitaires",
      "Collecte de données",
      "Rédaction de rapports",
    ],
  },
  {
    keywords: [
      "chef de projet",
      "cheffe de projet",
      "gestionnaire de projet",
      "project manager",
      "chargee de projet",
      "charge de projet",
      "coordinateur",
      "coordinatrice",
      "pmo",
    ],
    skills: [
      "Gestion de projet",
      "Planification de projet",
      "Gestion des parties prenantes",
      "Gestion des risques projet",
      "Reporting",
    ],
  },
  {
    keywords: [
      "logistique",
      "logisticien",
      "logisticienne",
      "supply chain",
      "achats",
      "acheteur",
      "acheteuse",
      "approvisionnement",
      "magasinier",
      "transit",
    ],
    skills: ["Logistique", "Supply chain", "Gestion des stocks", "Approvisionnement", "Achats"],
  },
  {
    keywords: [
      "assistant de direction",
      "assistante de direction",
      "assistant administratif",
      "assistante administrative",
      "secretaire",
      "office manager",
      "receptionniste",
    ],
    skills: [
      "Assistanat de direction",
      "Gestion d'agenda",
      "Rédaction de courriers administratifs",
      "Gestion documentaire",
      "Bureautique",
    ],
  },
  {
    keywords: ["formateur", "formatrice", "enseignant", "enseignante", "professeur", "coach"],
    skills: [
      "Formation d'adultes",
      "Facilitation d'ateliers",
      "Prise de parole en public",
      "Communication orale",
      "Planification de projet",
    ],
  },
];

/** Lower case, no accents, words separated by single spaces. */
const normalize = (value: string) =>
  ` ${value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

/**
 * The key skills of the family whose keyword best fits the target job (the longest keyword found
 * wins: « réseaux sociaux » before « réseau »), or none.
 */
export function familySkills(role: string): string[] {
  const text = normalize(role);
  if (text.trim().length === 0) return [];
  let best: { length: number; skills: string[] } | null = null;
  for (const family of families)
    for (const keyword of family.keywords) {
      const key = normalize(keyword);
      if (text.includes(key) && key.length > (best?.length ?? 0))
        best = { length: key.length, skills: family.skills };
    }
  return best?.skills ?? [];
}
