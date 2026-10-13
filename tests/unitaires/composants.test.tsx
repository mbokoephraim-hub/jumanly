import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import {
  Alerte,
  BarreProgression,
  Bouton,
  ChampTexte,
  Interrupteur,
  JaugeQuota,
  Onglets,
  ScoreExplique,
} from "@/components/ui";
import { rendre } from "./rendu";

describe("Bouton", () => {
  it("est bloqué et annonce le chargement", () => {
    rendre(<Bouton chargement>{"Envoyer"}</Bouton>);
    const bouton = screen.getByRole("button", { name: /Envoyer/ });
    expect(bouton).toBeDisabled();
    expect(bouton).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "Chargement en cours" })).toBeInTheDocument();
  });
});

describe("ChampTexte", () => {
  it("relie le libellé, l'aide et l'erreur au champ", () => {
    rendre(<ChampTexte id="email" label="E-mail" aide="Aide" erreur="Erreur" requis />);
    const champ = screen.getByLabelText(/E-mail/);
    expect(champ).toBeRequired();
    expect(champ).toHaveAttribute("aria-invalid", "true");
    expect(champ).toHaveAttribute("aria-describedby", "email-erreur email-aide");
  });

  it("indique les champs facultatifs", () => {
    rendre(<ChampTexte id="bio" label="Bio" />);
    expect(screen.getByText("(facultatif)", { exact: false })).toBeInTheDocument();
  });
});

describe("Interrupteur", () => {
  it("change d'état au clic", () => {
    rendre(<Interrupteur id="visible" label="Visible" />);
    const interrupteur = screen.getByRole("switch", { name: "Visible" });
    expect(interrupteur).toHaveAttribute("aria-checked", "false");
    fireEvent.click(interrupteur);
    expect(interrupteur).toHaveAttribute("aria-checked", "true");
  });
});

describe("Onglets", () => {
  it("se pilote au clavier", () => {
    rendre(
      <Onglets
        onglets={[
          { id: "a", libelle: "A", contenu: "Contenu A" },
          { id: "b", libelle: "B", contenu: "Contenu B" },
        ]}
      />,
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "A" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Contenu B")).toBeVisible();
  });
});

describe("Progression et quotas", () => {
  it("borne la valeur entre 0 et 100", () => {
    rendre(<BarreProgression valeur={140} label="Profil" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("affiche la consommation et la limite atteinte", () => {
    rendre(<JaugeQuota libelle="Crédits IA" utilise={5} limite={5} />);
    expect(screen.getByText("5 sur 5")).toBeInTheDocument();
    expect(screen.getByText("Limite atteinte pour ce mois.")).toBeInTheDocument();
  });

  it("gère un quota illimité", () => {
    rendre(<JaugeQuota libelle="Candidatures" utilise={3} limite={null} />);
    expect(screen.getByText("3 utilisés · illimité")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("Alerte", () => {
  it("annonce immédiatement les erreurs", () => {
    rendre(<Alerte ton="erreur" titre="Oups" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Oups");
  });
});

describe("ScoreExplique", () => {
  it("accompagne toujours le score de « Pourquoi ? »", () => {
    rendre(<ScoreExplique titre="Offre" score={86.6} explication="Parce que" />);
    expect(screen.getByText(/^87\s%$/)).toBeInTheDocument();
    expect(screen.getByText("Pourquoi ?")).toBeInTheDocument();
    expect(screen.getByText("L'IA recommande, vous décidez.")).toBeInTheDocument();
  });
});
