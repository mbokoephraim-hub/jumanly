import { describe, expect, it } from "vitest";
import { attestationSvg, escapeXml } from "@/server/pdf/attestation-sheet";
import {
  canonicalPayload,
  checkSignature,
  fingerprint,
  signCertificate,
} from "@/server/services/certificate-signature";

const certificate = {
  code: "JMN-7K4P-2QX9",
  courseTitle: "Excel pour le travail",
  holderName: "Grâce Démo",
  hours: 1,
  issuedAt: new Date("2026-10-18T09:00:00Z"),
  score: 90,
};

describe("Signature des attestations", () => {
  it("signe un texte stable : numéro, formation, titulaire, heures, date et score", () => {
    expect(JSON.parse(canonicalPayload(certificate))).toEqual({
      code: "JMN-7K4P-2QX9",
      course: "Excel pour le travail",
      holder: "Grâce Démo",
      hours: 1,
      issuedAt: "2026-10-18T09:00:00.000Z",
      score: 90,
    });
  });

  it("la signature correspond, et ne correspond plus si le nom ou la date changent", () => {
    const signed = { ...certificate, ...signCertificate(certificate) };
    expect(checkSignature(signed)).toBe("valid");
    expect(checkSignature({ ...signed, holderName: "Autre Personne" })).toBe("invalid");
    expect(checkSignature({ ...signed, issuedAt: new Date("2026-10-19T09:00:00Z") })).toBe(
      "invalid",
    );
    expect(checkSignature({ ...signed, score: 100 })).toBe("invalid");
  });

  it("une attestation non signée ou signée par une autre clé n'est pas déclarée modifiée", () => {
    const signed = { ...certificate, ...signCertificate(certificate) };
    expect(checkSignature({ ...certificate, signature: null, keyId: null })).toBe("unchecked");
    expect(checkSignature({ ...signed, keyId: "autre-cle" })).toBe("unchecked");
  });

  it("l'empreinte : 24 caractères hexadécimaux par groupes de 4", () => {
    const { short, full } = fingerprint(signCertificate(certificate).signature);
    expect(short).toMatch(/^([0-9A-F]{4}-){5}[0-9A-F]{4}$/);
    expect(full.replace(/-/g, "").startsWith(short.replace(/-/g, ""))).toBe(true);
  });
});

describe("Dessin de l'attestation", () => {
  const labels = {
    number: "N° JMN-7K4P-2QX9",
    delivered: "Délivrée le 18 octobre 2026",
    title: "Attestation",
    subtitle: "de réussite",
    intro: "Jumanly atteste que",
    body: "a suivi <b>Excel pour le travail</b>",
    signer: "Jumanly",
    signedOn: "Signé le 18 octobre 2026",
    fingerprint: "Empreinte A35D",
    verifyTitle: "Vérifier",
    verifyText: "Scannez le code",
    footer: "Jumanly",
    micro: "JUMANLY JMN-7K4P-2QX9 ",
    seal: "JUMANLY · ATTESTATION · ",
  };
  const data = {
    code: "JMN-7K4P-2QX9",
    holder: "Grâce <Démo> & Cie",
    fingerprint: fingerprint("signature-fictive").full,
    fingerprintShort: fingerprint("signature-fictive").short,
    verifyUrl: "https://jumanly.io/attestations/JMN-7K4P-2QX9",
    skills: ["Excel", "Tableaux croisés"],
  };

  it("un SVG autonome, A4 paysage, avec le nom échappé, les compétences et le code QR", () => {
    const svg = attestationSvg(data, labels);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 1123 794"');
    expect(svg).toContain(escapeXml(data.holder));
    expect(svg).not.toContain("<Démo>");
    expect(svg).toContain("<span>Tableaux croisés</span>");
    expect(svg).toContain("jumanly.io/attestations/JMN-7K4P-2QX9");
  });

  it("le même numéro donne le même dessin ; la vignette est plus légère", () => {
    expect(attestationSvg(data, labels)).toBe(attestationSvg(data, labels));
    expect(attestationSvg(data, labels, { light: true }).length).toBeLessThan(
      attestationSvg(data, labels).length,
    );
  });
});
