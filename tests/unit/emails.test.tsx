import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import ExampleEmail from "@/emails/example";

describe("Gabarit d'e-mail", () => {
  it("affiche l'adresse de contact et aucun numéro de téléphone", async () => {
    const html = await render(<ExampleEmail />);
    expect(html).toContain("assistant@jumanly.io");
    expect(html).toContain("Bienvenue sur Jumanly");
    expect(html).not.toMatch(/tel:/);
  });
});
