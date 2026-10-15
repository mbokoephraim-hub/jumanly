import { render } from "@react-email/components";
import { newMessageEmail } from "../../emails/_components/hire-content";
import { describe, expect, it } from "vitest";
import WelcomeTalentEmail from "../../emails/welcome-talent";

describe("E-mail de bienvenue", () => {
  it("affiche les adresses de contact et aucun numéro de téléphone", async () => {
    const html = await render(<WelcomeTalentEmail firstName="Awa" plan="Free" />);
    expect(html).toContain("Bonjour Awa,");
    expect(html).toContain("assistant@jumanly.io");
    expect(html).toContain("infojumanly@gmail.com");
    expect(html).not.toMatch(/tel:/);
  });
});

describe("E-mails Hire et Connect", () => {
  const previews = import.meta.glob<{ default: () => React.ReactElement }>(
    ["../../emails/hire-*.tsx", "../../emails/connect-*.tsx", "../../emails/organisation-*.tsx"],
    { eager: true },
  );

  it("chaque aperçu local se rend, avec un lien et sans numéro de téléphone", async () => {
    expect(Object.keys(previews).length).toBeGreaterThanOrEqual(7);
    for (const [file, module] of Object.entries(previews)) {
      const Preview = module.default;
      const html = await render(<Preview />);
      expect(html, file).toContain('href="http');
      expect(html, file).not.toMatch(/tel:/);
    }
  });

  it("un e-mail de nouveau message ne recopie jamais le message", () => {
    const email = newMessageEmail("Awa", {
      senderName: "Recruteur Exemple",
      company: "Cabinet Exemple",
      jobTitle: "Analyste",
      href: "/app/messages/abc",
    });
    expect(email.props.paragraphs.join(" ")).toContain("Recruteur Exemple");
    expect(email.props.cta?.href).toMatch(/\/app\/messages\/abc$/);
  });
});
