import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { Alert, Button, ExplainedScore, ProgressBar, QuotaGauge, TextField } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { renderWithTexts } from "./render";

describe("Button", () => {
  it("est bloqué et annonce le chargement", () => {
    renderWithTexts(<Button loading>{"Envoyer"}</Button>);
    const button = screen.getByRole("button", { name: /Envoyer/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "Chargement…" })).toBeInTheDocument();
  });
});

describe("TextField", () => {
  it("relie le libellé, l'aide et l'erreur au champ", () => {
    renderWithTexts(<TextField id="email" label="E-mail" hint="Aide" error="Erreur" required />);
    const input = screen.getByLabelText(/E-mail/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error email-hint");
  });

  it("indique les champs facultatifs", () => {
    renderWithTexts(<TextField id="bio" label="Bio" />);
    expect(screen.getByText(/Facultatif/)).toBeInTheDocument();
  });
});

describe("Switch", () => {
  it("change d'état au clic", () => {
    renderWithTexts(<Switch id="visible" label="Visible" />);
    const toggle = screen.getByRole("switch", { name: "Visible" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});

describe("Tabs", () => {
  it("se pilote au clavier", () => {
    renderWithTexts(
      <Tabs
        tabs={[
          { id: "a", label: "A", content: "Contenu A" },
          { id: "b", label: "B", content: "Contenu B" },
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
    renderWithTexts(<ProgressBar value={140} label="Profil" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("affiche la consommation et la limite atteinte", () => {
    renderWithTexts(<QuotaGauge label="Crédits IA" used={5} limit={5} />);
    expect(screen.getByText("5 sur 5")).toBeInTheDocument();
    expect(screen.getByText("Quota atteint")).toBeInTheDocument();
  });

  it("gère un quota illimité", () => {
    renderWithTexts(<QuotaGauge label="Candidatures" used={3} limit={null} />);
    expect(screen.getByText("Illimité")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("Alert", () => {
  it("annonce immédiatement les erreurs", () => {
    renderWithTexts(<Alert tone="error" title="Oups" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Oups");
  });
});

describe("ExplainedScore", () => {
  it("accompagne toujours le score de « Pourquoi ? » (CLAUDE.md § 3)", () => {
    renderWithTexts(<ExplainedScore title="Offre" score={86.6} explanation="Parce que" />);
    expect(screen.getByText(/^87\s%$/)).toBeInTheDocument();
    expect(screen.getByText("Pourquoi ?")).toBeInTheDocument();
    expect(screen.getByText("L'IA recommande, l'humain décide.")).toBeInTheDocument();
  });
});
