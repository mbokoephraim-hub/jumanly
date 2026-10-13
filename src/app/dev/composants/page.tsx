import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { AiOrb, Character, Icon, Logo, Orbi, characters, poses } from "@/components/brand";
import type { IconName } from "@/components/brand/icon";
import { iconPaths } from "@/components/brand/icon-paths";
import {
  AiCard,
  Alert,
  AvatarStack,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardText,
  CardTitle,
  Checkbox,
  CourseCard,
  EmptyState,
  ExplainedScore,
  FilterChip,
  IconButton,
  JobCard,
  PipelineSteps,
  PlanCard,
  PlanLock,
  ProgressBar,
  ProgressRing,
  QuotaGauge,
  RadioGroup,
  ScoreBadge,
  SearchField,
  Select,
  Skeleton,
  Spinner,
  StatCard,
  Table,
  Td,
  TextArea,
  Th,
  TrendBadge,
  VerifiedBadge,
  TextField,
  type ButtonVariant,
  type CardTone,
} from "@/components/ui";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { pickMessages } from "@/i18n/client-messages";
import { isInternalEnv } from "@/lib/env";
import { DrawerDemo, ModalDemo, ToastDemo } from "./interactive-demos";

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

/** The interactive demos are client components: they receive only the texts they need. */
async function ClientTexts({ children }: { children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, ["a11y", "common", "devComponents", "toast"])}
    >
      {children}
    </NextIntlClientProvider>
  );
}

const iconNames = Object.keys(iconPaths) as IconName[];

const patterns = [
  "fonds/fond-01-creme-trajectoire-16x9.svg",
  "fonds/fond-06-sapin-orbites-16x9.svg",
  "fonds/fond-08-intelligence-16x9.svg",
  "fonds/fond-05-signature-16x9.svg",
  "motifs/motif-pastilles-clair.svg",
  "motifs/motif-reseau-sombre.svg",
  "motifs/motif-trajectoires-lime.svg",
  "motifs/motif-monogramme-clair.svg",
];

const buttonVariants: ButtonVariant[] = ["primary", "secondary", "tertiary", "danger"];

const moduleTones = ["learn", "career", "jobs", "hire", "connect"] as const satisfies CardTone[];

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
  // Also checked here: layout and page render in parallel (see src/app/dev/layout.tsx).
  if (!isInternalEnv()) notFound();
  const t = useTranslations("devComponents");
  const s = useTranslations("devComponents.states");
  const g = useTranslations();
  const countries = [
    { value: "cd", label: t("fields.countryA") },
    { value: "cm", label: t("fields.countryB") },
    { value: "sn", label: t("fields.countryC") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 page-x py-10">
      <header className="flex flex-col gap-3">
        <Logo height={36} />
        <h1 className="text-h1">{t("title")}</h1>
        <p className="max-w-2xl text-ardoise">{t("intro")}</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/" variant="tertiary" size="sm">
            {t("publicLayout")}
          </ButtonLink>
          <ButtonLink href="/app" variant="tertiary" size="sm">
            {t("appLayout")}
          </ButtonLink>
        </div>
      </header>

      <Section title={t("sections.brand")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <State label={t("brand.primary")}>
            <div className="flex h-24 w-full items-center justify-center rounded-md bg-blanc">
              <Logo height={32} />
            </div>
          </State>
          <State label={t("brand.negative")}>
            <div className="flex h-24 w-full items-center justify-center rounded-md bg-sapin">
              <Logo variant="negative" height={32} />
            </div>
          </State>
          <State label={t("brand.symbol")}>
            <div className="flex h-24 w-full items-center justify-center gap-4 rounded-md bg-gradient-depth">
              <Logo variant="symbolLight" height={44} />
              <span className="rounded-sm bg-creme p-1">
                <Logo variant="symbol" height={44} />
              </span>
            </div>
          </State>
          <State label={t("brand.orb")}>
            <div className="flex h-24 w-full items-center justify-center rounded-md bg-sapin">
              <AiOrb className="size-12" labelled />
            </div>
          </State>
        </div>
        <State label={t("brand.icons")}>
          <div className="flex flex-col gap-3">
            {(["text-sapin", "rounded-md bg-sapin p-3 text-blanc"] as const).map((classes) => (
              <div key={classes} className={`flex flex-wrap gap-3 ${classes}`}>
                {iconNames.map((name) => (
                  <Icon key={name} name={name} className="size-6" />
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-3 text-sapin">
              {iconNames.map((name) => (
                <Icon key={name} name={name} duo className="size-6" />
              ))}
            </div>
          </div>
        </State>
        <State label={t("brand.characters")}>
          <div className="flex flex-wrap items-end gap-4">
            {characters.map((name) => (
              <Character key={name} name={name} pose="salut" height={140} labelled />
            ))}
            <Orbi size={80} labelled />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {poses.map((pose) => (
              <Character key={pose} name="nadia" pose={pose} height={110} />
            ))}
          </div>
        </State>
        <State label={t("brand.patterns")}>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {patterns.map((file) => (
              <div
                key={file}
                className="h-24 rounded-md bg-cover"
                style={{ backgroundImage: `url(/marque/${file})` }}
              />
            ))}
          </div>
        </State>
      </Section>

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
        <p className="text-label">{t("type.label")}</p>
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
                <Button variant={variant} icon={<Icon name="suivant" className="size-4" />}>
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
          <div className="flex flex-wrap items-end gap-4">
            <State label={t("variants.icon")}>
              <div className="flex gap-2">
                <IconButton label={g("jobs.card.save")}>
                  <Icon name="favori" className="size-5" />
                </IconButton>
                <IconButton label={g("jobs.card.save")} variant="outline">
                  <Icon name="favori" className="size-5" />
                </IconButton>
                <IconButton label={g("jobs.card.save")} variant="sapin">
                  <Icon name="favori" className="size-5" />
                </IconButton>
                <IconButton label={g("jobs.card.save")} variant="lime">
                  <Icon name="favori" className="size-5" />
                </IconButton>
                <IconButton label={g("a11y.close")} disabled>
                  <Icon name="fermer" className="size-5" />
                </IconButton>
              </div>
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

      <Section title={t("sections.search")}>
        <form className="flex flex-col gap-4" action="/offres">
          <SearchField
            id="demo-search"
            name="q"
            label={t("search.id")}
            placeholder={t("search.placeholder")}
            className="max-w-xl"
          />
          <div className="flex flex-wrap gap-2">
            <FilterChip id="demo-filter-remote" name="remote" label={t("search.filterRemote")} />
            <FilterChip
              id="demo-filter-full-time"
              name="fullTime"
              label={t("search.filterFullTime")}
              defaultChecked
            />
            <FilterChip id="demo-filter-free" name="free" label={t("search.filterFree")} />
            <FilterChip id="demo-filter-off" label={t("search.filterDisabled")} disabled />
          </div>
        </form>
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
        <div className="flex flex-wrap gap-2">
          <Badge tone="new">{g("common.new")}</Badge>
          {moduleTones.map((tone) => (
            <Badge key={tone} tone={tone}>
              {t(`cards.tone.${tone}`)}
            </Badge>
          ))}
          <Badge tone="jobs">{t("badges.contract")}</Badge>
          <VerifiedBadge />
          <TrendBadge value={12} label={t("badges.trendUp")} />
          <TrendBadge value={-3} label={t("badges.trendDown")} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge score={91} band="veryHigh" />
          <ScoreBadge score={78} band="high" />
          <ScoreBadge score={58} band="partial" />
          <ScoreBadge score={32} band="low" />
        </div>
      </Section>

      <Section title={t("sections.cards")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>{t("cards.defaultTitle")}</CardTitle>
            <CardText>{t("cards.defaultText")}</CardText>
          </Card>
          <Card tone="intelligence">
            <CardTitle>{t("cards.tintedTitle")}</CardTitle>
            <CardText>{t("cards.tintedText")}</CardText>
          </Card>
          <Card tone="dark">
            <CardTitle>{t("cards.darkTitle")}</CardTitle>
            <CardText>{t("cards.darkText")}</CardText>
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {moduleTones.map((tone) => (
            <Card key={tone} tone={tone} className="p-5">
              <CardTitle>{t(`cards.tone.${tone}`)}</CardTitle>
            </Card>
          ))}
          <Card selected className="p-5">
            <CardTitle>{t("cards.selected")}</CardTitle>
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
          <AvatarStack
            names={[
              t("avatars.name"),
              t("avatars.nameB"),
              t("avatars.nameC"),
              t("avatars.nameD"),
              t("avatars.nameE"),
              t("avatars.nameF"),
            ]}
          />
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
        <div className="max-w-md">
          <AiCard
            explanation={t("ai.suggestionWhy")}
            actions={
              <>
                <Button size="sm">{g("ai.card.apply")}</Button>
                <Button size="sm" variant="tertiary" className="border-blanc/40 text-blanc">
                  {g("ai.card.ignore")}
                </Button>
              </>
            }
          >
            {t("ai.suggestion")}
          </AiCard>
        </div>
      </Section>

      <Section title={t("sections.stats")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={t("stats.applications")} value={t("stats.applicationsValue")} />
          <StatCard
            label={t("stats.views")}
            value={t("stats.viewsValue")}
            hint={<TrendBadge value={12} label={t("stats.viewsTrend")} />}
          />
          <StatCard tone="learn" label={t("stats.courses")} value={t("stats.coursesValue")} />
        </div>
      </Section>

      <Section title={t("sections.listings")}>
        <div className="grid gap-4 md:grid-cols-3">
          <CourseCard
            title={t("listings.courseTitle")}
            href="/formations"
            level={t("listings.courseLevel")}
            lessons={12}
            duration={t("listings.courseDuration")}
            certificate
          />
          <CourseCard
            title={t("listings.courseTitle")}
            href="/formations"
            level={t("listings.courseLevel")}
            lessons={1}
            duration={t("listings.courseDuration")}
            plan={t("listings.coursePlan")}
          />
          <JobCard
            title={t("listings.jobTitle")}
            href="/offres"
            company={t("listings.jobCompany")}
            city={t("listings.jobCity")}
            country={t("listings.jobCountry")}
            remote="hybrid"
            contract={t("listings.jobContract")}
            deadline={t("listings.jobDeadline")}
            verified
            isNew
            match={{ score: 87, band: "veryHigh" }}
          />
          <JobCard
            title={t("listings.jobBTitle")}
            href="/offres"
            company={t("listings.jobCompany")}
            city={t("listings.jobBCity")}
            country={t("listings.jobBCountry")}
            remote="onsite"
            contract={t("listings.jobBContract")}
            deadline={t("listings.jobDeadline")}
          />
        </div>
      </Section>

      <Section title={t("sections.pipeline")}>
        <PipelineSteps
          counts={{ new: 14, screening: 6, test: 3, interview: 2, offer: 1, hired: 0 }}
          current="interview"
        />
      </Section>

      <Section title={t("sections.table")}>
        <Table caption={t("table.caption")}>
          <thead>
            <tr>
              <Th>{t("table.name")}</Th>
              <Th>{t("table.stage")}</Th>
              <Th>{g("match.score.label")}</Th>
              <Th>{t("table.date")}</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>{t("avatars.name")}</Td>
              <Td>{g("hire.pipeline.stage.interview")}</Td>
              <Td>
                <ScoreBadge score={87} band="veryHigh" />
              </Td>
              <Td>{t("table.date1")}</Td>
            </tr>
            <tr>
              <Td>{t("avatars.nameB")}</Td>
              <Td>{g("hire.pipeline.stage.screening")}</Td>
              <Td>
                <ScoreBadge score={64} band="partial" />
              </Td>
              <Td>{t("table.date2")}</Td>
            </tr>
          </tbody>
        </Table>
      </Section>

      <Section title={t("sections.plans")}>
        <div className="flex flex-wrap items-center gap-3">
          <PlanLock plan={t("plans.lockPlan")} compact />
        </div>
        <div className="max-w-md">
          <PlanLock plan={t("plans.lockPlan")} description={t("plans.lockText")} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <PlanCard
            name={t("plans.freeName")}
            priceCents={0}
            audience={t("plans.audience")}
            features={[t("plans.feature1")]}
            current
            ctaLabel={t("plans.ctaFree")}
            ctaHref="/inscription"
          />
          <PlanCard
            name={t("plans.paidName")}
            priceCents={990}
            audience={t("plans.audience")}
            features={[t("plans.feature1"), t("plans.feature2"), t("plans.feature3")]}
            includesPlan={t("plans.freeName")}
            recommended
            ctaLabel={t("plans.ctaPaid")}
            ctaHref="/tarifs"
          />
          <PlanCard
            name={t("plans.paidName")}
            priceCents={null}
            audience={t("plans.audience")}
            features={[t("plans.feature2")]}
            ctaLabel={g("pricing.company.premium.cta")}
            ctaHref="/contact"
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
          title={t("empty.title")}
          description={t("empty.text")}
          action={
            <ButtonLink href="/offres" icon={<Icon name="intelligence" className="size-4" />}>
              {t("empty.action")}
            </ButtonLink>
          }
        />
      </Section>

      <ClientTexts>
        <Section title={t("sections.toast")}>
          <ToastDemo />
        </Section>
        <Section title={t("sections.modal")}>
          <ModalDemo />
        </Section>
        <Section title={t("sections.drawer")}>
          <DrawerDemo />
        </Section>
      </ClientTexts>
    </div>
  );
}
