import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import WelcomeTalentEmail from "../../emails/welcome-talent";

describe("E-mail de bienvenue", () => {
  it("affiche les adresses de contact et aucun numéro de téléphone", async () => {
    const html = await render(<WelcomeTalentEmail firstName="Awa" plan="Free" />);
    expect(html).toContain("Bienvenue sur Jumanly, Awa");
    expect(html).toContain("assistant@jumanly.io");
    expect(html).toContain("infojumanly@gmail.com");
    expect(html).not.toMatch(/tel:/);
  });
});
