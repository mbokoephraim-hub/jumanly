// @vitest-environment node
/** The job sheet in PDF (publication d'offre étape par étape, 29/10/2026), with fictional data. */
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";
import sharp from "sharp";
import { renderJobSheet, JOB_SHEET_BRAND_LOGO } from "@/server/pdf/job-sheet";
import { expect, test } from "vitest";

for (const withLogo of [true, false])
  test(
    "render " + withLogo,
    async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="40" fill="#1d4ed8"/><text x="128" y="160" font-family="Arial" font-weight="700" font-size="110" fill="#fff" text-anchor="middle">BH</text></svg>`;
      const logo = withLogo ? await sharp(Buffer.from(svg)).png().toBuffer() : null;
      const brandLogo = await sharp(JOB_SHEET_BRAND_LOGO).resize({ width: 700 }).png().toBuffer();
      const url = "https://jumanly.io/offres/analyste-credit-junior-kinshasa";
      const qr = await QRCode.toDataURL(url, { margin: 0, width: 300, color: { dark: "#0F3F37" } });
      const pdf = await renderJobSheet({
        labels: {
          kind: "Fiche de poste",
          facts: {
            contract: "Contrat",
            place: "Lieu",
            remote: "Mode de travail",
            openings: "Postes à pourvoir",
            experience: "Expérience",
            education: "Niveau d'études",
            closesAt: "Date limite",
          },
          company: "L'entreprise",
          post: "Le poste",
          responsibilities: "Principales responsabilités",
          hardSkills: "Compétences techniques",
          softSkills: "Compétences comportementales",
          profile: "Profil recherché",
          languages: "Langues",
          salary: "Salaire",
          salaryPeriod: "par mois, brut",
          applyTitle: "Candidatez gratuitement sur Jumanly",
          applyText:
            "Scannez le code ou ouvrez le lien : votre profil, votre CV et vos réponses partent en une fois. Candidater est toujours gratuit.",
          applyFree: "Candidater · gratuit",
          seal: "ORIGINAL",
          sealCenter: "JUMANLY",
          codeLabel: "N° d'authentification",
          verify: "Vérifiez l'authenticité de cette fiche sur",
          issued: "Fiche émise par Jumanly le 29 octobre 2026 pour Banque Horizon.",
          microtext: "JUMANLY DOCUMENT ORIGINAL",
          footer: "jumanly.io · assistant@jumanly.io · Learn. Grow. Connect.",
          page: (p, t) => `Page ${p} sur ${t}`,
        },
        data: {
          org: {
            name: "Banque Horizon (exemple fictif)",
            logo,
            initials: "BH",
            line: "Banque et finance · Kinshasa",
          },
          title: "Analyste crédit junior",
          place: "Kinshasa, RD Congo",
          contract: "CDI",
          remote: "Hybride",
          openings: "2 personnes",
          experience: "2 ans au moins",
          education: "Licence (Bac+3)",
          closesAt: "30 novembre 2026",
          about:
            "Banque Horizon accompagne les petites et moyennes entreprises de la RD Congo depuis 2012. Nos 300 collaborateurs financent l'agriculture, le commerce et l'artisanat, avec une ambition simple : rendre le crédit accessible à ceux qui créent de l'emploi.",
          description:
            "Au sein de l'équipe Engagements (8 personnes), vous analysez les demandes de crédit des PME et préparez les dossiers présentés au comité. Vous apprendrez à lire un bilan, à évaluer un risque et à défendre une recommandation, accompagné·e par un analyste senior pendant les six premiers mois.",
          responsibilities: [
            "Analyser les états financiers et la trésorerie des entreprises clientes.",
            "Rédiger les notes de crédit et présenter vos recommandations au comité.",
            "Suivre le portefeuille et signaler les premiers signes de difficulté.",
            "Rencontrer les clients avec les chargés d'affaires, sur place ou à distance.",
          ],
          hardSkills: [
            "Analyse financière",
            "Microsoft Excel",
            "Comptabilité OHADA",
            "Power BI",
            "Rédaction de notes de crédit",
          ],
          softSkills: ["Rigueur", "Esprit de synthèse", "Communication orale", "Travail en équipe"],
          requirements: [
            "Diplôme en économie, finance ou gestion.",
            "Une première expérience en banque, microfinance ou cabinet d'audit.",
            "Aisance avec les chiffres et goût pour le contact client.",
          ],
          languages: [
            { name: "Français", level: "C1" },
            { name: "Anglais", level: "B1" },
            { name: "Lingala", level: "B2" },
          ],
          salary: "600 à 900 USD",
          brandLogo,
          code: "JMLY-7K3Q-9XA2",
          verifyUrl: "jumanly.io/verifier/JMLY-7K3Q-9XA2",
          applyUrl: url,
          qr,
        },
      });
      expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
      // FICHE_OUT=<folder> keeps the files, to look at the design.
      if (process.env.FICHE_OUT)
        writeFileSync(`${process.env.FICHE_OUT}/fiche-${withLogo ? "logo" : "initiales"}.pdf`, pdf);
    },
    30000,
  );
