import type { Metadata } from "next";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Inbox, Sparkles } from "lucide-react";
import {
  AiOrb,
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardText,
  CardTitle,
  Checkbox,
  EmptyState,
  ExplainedScore,
  Logo,
  ProgressBar,
  ProgressRing,
  QuotaGauge,
  RadioGroup,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  TextField,
  type ButtonVariant,
} from "@/components/ui";
import { ModalDemo } from "./modal-demo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("devComponents");
  // Internal page: never indexed by search engines.
  return { title: t("title"), robots: { index: false, follow: false } };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-brume pt-8">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-ardoise text-caption">{label}</span>
      {children}
    </div>
  );
}

const buttonVariants: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "danger"];

const colors = [
  ["sapin", "bg-sapin"],
  ["lime", "bg-lime"],
  ["creme", "bg-creme border border-brume"],
  ["blanc", "bg-blanc border border-brume"],
  ["feuille", "bg-feuille"],
  ["menthe", "bg-menthe"],
  ["nuit", "bg-nuit"],
  ["neon", "bg-neon"],
  ["ardoise", "bg-ardoise"],
  ["brume", "bg-brume"],
  ["ambre", "bg-ambre"],
  ["corail", "bg-corail"],
  ["mentheClaire", "bg-menthe-claire"],
] as const;

const gradients = [
  ["signature", "bg-gradient-signature"],
  ["ai", "bg-gradient-ai"],
  ["depth", "bg-gradient-depth"],
] as const;

/** Showcase of the component library, with every state. */
export default function ComponentsPage() {
  const t = useTranslations("devComponents");
  const s = useTranslations("devComponents.states");
  const countries = [
    { value: "cd", label: t("fields.countryA") },
    { value: "cm", label: t("fields.countryB") },
    { value: "sn", label: t("fields.countryC") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <Logo height={36} />
        <h1 className="text-[32px] leading-10 font-semibold md:text-h1">{t("title")}</h1>
        <p className="max-w-2xl text-ardoise">{t("intro")}</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/" variant="outline" size="sm">
            {t("publicLayout")}
          </ButtonLink>
          <ButtonLink href="/app" variant="outline" size="sm">
            {t("appLayout")}
          </ButtonLink>
        </div>
      </header>

      <Section title={t("sections.colors")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {colors.map(([key, classes]) => (
            <div key={key} className="flex flex-col gap-2">
              <div className={`h-16 rounded-sm ${classes}`} />
              <span className="text-caption">{t(`colors.${key}`)}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {gradients.map(([key, classes]) => (
            <div key={key} className="flex flex-col gap-2">
              <div className={`h-20 rounded-md ${classes}`} />
              <span className="text-caption">{t(`gradients.${key}`)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("sections.typography")}>
        <p className="text-display">{t("type.display")}</p>
        <p className="text-h1">{t("type.h1")}</p>
        <p className="text-h2">{t("type.h2")}</p>
        <p className="text-feuille text-label">{t("type.label")}</p>
        <p className="text-body">{t("type.body")}</p>
        <p className="text-caption">{t("type.caption")}</p>
      </Section>

      <Section title={t("sections.buttons")}>
        <div className="flex flex-col gap-6">
          {buttonVariants.map((variant) => (
            <div key={variant} className="flex flex-wrap items-end gap-4">
              <State label={t(`variants.${variant}`)}>
                <Button variant={variant}>{t("buttons.action")}</Button>
              </State>
              <State label={s("icon")}>
                <Button variant={variant} icon={<ArrowRight aria-hidden className="size-4" />}>
                  {t("buttons.action")}
                </Button>
              </State>
              <State label={s("loading")}>
                <Button variant={variant} loading>
                  {t("buttons.action")}
                </Button>
              </State>
              <State label={s("disabled")}>
                <Button variant={variant} disabled>
                  {t("buttons.action")}
                </Button>
              </State>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-4">
            <State label={s("small")}>
              <Button size="sm">{t("buttons.action")}</Button>
            </State>
            <State label={s("medium")}>
              <Button size="md">{t("buttons.action")}</Button>
            </State>
            <State label={s("large")}>
              <Button size="lg">{t("buttons.action")}</Button>
            </State>
            <State label={s("link")}>
              <ButtonLink href="/app" variant="secondary">
                {t("buttons.link")}
              </ButtonLink>
            </State>
          </div>
        </div>
      </Section>

      <Section title={t("sections.fields")}>
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            id="demo-name"
            label={t("fields.name")}
            placeholder={t("fields.namePlaceholder")}
            required
          />
          <TextField
            id="demo-email"
            type="email"
            label={t("fields.email")}
            hint={t("fields.emailHint")}
          />
          <TextField
            id="demo-error"
            label={t("fields.email")}
            defaultValue={t("fields.emailInvalid")}
            error={t("fields.emailError")}
            required
          />
          <TextField
            id="demo-disabled"
            label={t("fields.locked")}
            defaultValue={t("fields.lockedValue")}
            disabled
          />
          <Select
            id="demo-country"
            label={t("fields.country")}
            placeholder={t("fields.countryPlaceholder")}
            options={countries}
          />
          <Select
            id="demo-country-error"
            label={t("fields.country")}
            placeholder={t("fields.countryPlaceholder")}
            options={countries}
            error={t("fields.countryError")}
            required
          />
          <div className="md:col-span-2">
            <TextArea id="demo-bio" label={t("fields.bio")} hint={t("fields.bioHint")} />
          </div>
        </div>
      </Section>

      <Section title={t("sections.choices")}>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Checkbox id="demo-check-1" label={t("choices.terms")} />
            <Checkbox
              id="demo-check-2"
              label={t("choices.alerts")}
              hint={t("choices.alertsHint")}
              defaultChecked
            />
            <Checkbox id="demo-check-3" label={s("disabled")} disabled />
          </div>
          <RadioGroup
            legend={t("choices.profile")}
            name="demo-profile"
            defaultValue="talent"
            options={[
              { value: "talent", label: t("choices.talent") },
              { value: "recruiter", label: t("choices.recruiter") },
              { value: "company", label: t("choices.company"), disabled: true },
            ]}
          />
          <div className="flex flex-col gap-4">
            <Switch
              id="demo-switch-1"
              label={t("choices.visible")}
              hint={t("choices.visibleHint")}
              checked
            />
            <Switch id="demo-switch-2" label={t("choices.digest")} />
            <Switch id="demo-switch-3" label={s("disabled")} disabled />
          </div>
        </div>
      </Section>

      <Section title={t("sections.badges")}>
        <div className="flex flex-wrap gap-2">
          <Badge>{t("badges.neutral")}</Badge>
          <Badge tone="sapin">{t("badges.sapin")}</Badge>
          <Badge tone="lime">{t("badges.lime")}</Badge>
          <Badge tone="success">{t("badges.success")}</Badge>
          <Badge tone="warning">{t("badges.warning")}</Badge>
          <Badge tone="error">{t("badges.error")}</Badge>
          <Badge tone="ai" icon={<AiOrb className="size-2.5" />}>
            {t("badges.ai")}
          </Badge>
        </div>
      </Section>

      <Section title={t("sections.cards")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>{t("cards.defaultTitle")}</CardTitle>
            <CardText>{t("cards.defaultText")}</CardText>
          </Card>
          <Card appearance="tinted">
            <CardTitle>{t("cards.tintedTitle")}</CardTitle>
            <CardText>{t("cards.tintedText")}</CardText>
          </Card>
          <Card appearance="dark">
            <CardTitle>{t("cards.darkTitle")}</CardTitle>
            <CardText>{t("cards.darkText")}</CardText>
          </Card>
        </div>
      </Section>

      <Section title={t("sections.alerts")}>
        <div className="grid gap-3 md:grid-cols-2">
          <Alert title={t("alerts.infoTitle")}>{t("alerts.infoText")}</Alert>
          <Alert tone="success" title={t("alerts.successTitle")}>
            {t("alerts.successText")}
          </Alert>
          <Alert
            tone="warning"
            title={t("alerts.warningTitle")}
            action={
              <ButtonLink href="/tarifs" variant="secondary" size="sm">
                {t("alerts.warningAction")}
              </ButtonLink>
            }
          >
            {t("alerts.warningText")}
          </Alert>
          <Alert tone="error" title={t("alerts.errorTitle")}>
            {t("alerts.errorText")}
          </Alert>
        </div>
      </Section>

      <Section title={t("sections.avatars")}>
        <div className="flex items-center gap-4">
          <Avatar name={t("avatars.name")} size="sm" />
          <Avatar name={t("avatars.name")} />
          <Avatar name={t("avatars.name")} size="lg" />
        </div>
      </Section>

      <Section title={t("sections.tabs")}>
        <Tabs
          tabs={[
            { id: "talents", label: t("tabs.talents"), content: <p>{t("tabs.talentsText")}</p> },
            {
              id: "recruiters",
              label: t("tabs.recruiters"),
              content: <p>{t("tabs.recruitersText")}</p>,
            },
            {
              id: "companies",
              label: t("tabs.companies"),
              content: <p>{t("tabs.companiesText")}</p>,
            },
          ]}
        />
      </Section>

      <Section title={t("sections.progress")}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <ProgressBar value={64} label={t("progress.profile")} />
            <ProgressBar value={35} label={t("progress.course")} tone="lime" />
            <div className="flex gap-6">
              <ProgressRing value={64} label={t("progress.profile")} />
              <ProgressRing value={100} label={t("progress.course")} />
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <QuotaGauge label={t("progress.quotaNormal")} used={3} limit={10} />
            <QuotaGauge label={t("progress.quotaNear")} used={17} limit={20} />
            <QuotaGauge label={t("progress.quotaReached")} used={5} limit={5} />
            <QuotaGauge label={t("progress.quotaUnlimited")} used={42} limit={null} />
          </div>
        </div>
      </Section>

      <Section title={t("sections.ai")}>
        <div className="max-w-md">
          <ExplainedScore
            title={t("ai.job")}
            score={87}
            explanation={
              <ul className="list-disc pl-5">
                <li>{t("ai.reason1")}</li>
                <li>{t("ai.reason2")}</li>
                <li>{t("ai.reason3")}</li>
              </ul>
            }
          />
        </div>
      </Section>

      <Section title={t("sections.loading")}>
        <div className="flex flex-wrap items-center gap-6">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </div>
        <Card className="flex max-w-md flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      </Section>

      <Section title={t("sections.empty")}>
        <EmptyState
          icon={<Inbox aria-hidden className="size-6" />}
          title={t("empty.title")}
          description={t("empty.text")}
          action={
            <ButtonLink href="/offres" icon={<Sparkles aria-hidden className="size-4" />}>
              {t("empty.action")}
            </ButtonLink>
          }
        />
      </Section>

      <Section title={t("sections.modal")}>
        <ModalDemo />
      </Section>
    </div>
  );
}
