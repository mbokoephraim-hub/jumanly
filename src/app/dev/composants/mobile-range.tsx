import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand";
import {
  AiBento,
  AiChip,
  Button,
  DecisionCard,
  FileCard,
  GoalCard,
  IconButton,
  PressArrow,
  Pressable,
  ProfileCard,
  SlotCard,
  VisualTile,
} from "@/components/ui";
import { Switch } from "@/components/ui/switch";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] bg-blanc/60 p-4 ring-1 ring-brume">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="opacity-75 text-caption">{label}</span>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-brume pt-8">
      <h2 className="text-h2">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The mobile Talent v5 range (docs/ux-mobile-talent, prompt 1): buttons, visual cards and
 * interaction states, with every state. Fictional examples only.
 */
export function MobileRange() {
  const t = useTranslations("devComponents");
  const m = useTranslations("devComponents.mobile");
  const f = useTranslations("foundation");

  return (
    <>
      <Section title={t("sections.mobileButtons")}>
        <div id="gamme-boutons" className="grid gap-4 lg:grid-cols-3">
          <Panel title={m("principal")}>
            <div className="flex flex-wrap items-end gap-4">
              <State label={m("rest")}>
                <Button variant="principal" size="L" arrow>
                  {m("apply")}
                </Button>
              </State>
              <State label={m("loading")}>
                <Button variant="principal" size="L" loading>
                  {m("sending")}
                </Button>
              </State>
              <State label={m("done")}>
                <Button variant="principal" size="L" done>
                  {m("sent")}
                </Button>
              </State>
              <State label={m("disabled")}>
                <Button variant="principal" size="L" disabled>
                  {m("apply")}
                </Button>
              </State>
              <State label={m("sizeM")}>
                <Button variant="principal" size="M">
                  {m("confirm")}
                </Button>
              </State>
              <State label={m("sizeS")}>
                <Button variant="principal" size="S">
                  {m("reply")}
                </Button>
              </State>
            </div>
          </Panel>
          <Panel title={m("accent")}>
            <div className="flex flex-wrap items-end gap-4">
              <State label={m("sizeL")}>
                <Button variant="accent" size="L" icon={<Icon name="play" />}>
                  {m("resume")}
                </Button>
              </State>
              <State label={m("sizeM")}>
                <Button variant="accent" size="M">
                  {m("upgrade")}
                </Button>
              </State>
              <State label={m("sizeS")}>
                <Button variant="accent" size="S">
                  {m("start")}
                </Button>
              </State>
            </div>
          </Panel>
          <Panel title={`${m("soft")} · ${m("outline")} · ${m("link")}`}>
            <div className="flex flex-wrap items-end gap-4">
              <State label={m("soft")}>
                <Button variant="soft" size="M">
                  {m("later")}
                </Button>
              </State>
              <State label={m("outline")}>
                <Button variant="outline" size="M" icon={<Icon name="edit" />}>
                  {m("edit")}
                </Button>
              </State>
              <State label={m("link")}>
                <Button variant="link" size="S">
                  {m("seeAll")}
                </Button>
              </State>
              <IconButton label={m("save")} variant="outline">
                <Icon name="favori" className="size-5" />
              </IconButton>
            </div>
          </Panel>
          <Panel title={m("ai")}>
            <div className="flex flex-wrap items-end gap-4">
              <AiChip size="L">{m("askAi")}</AiChip>
              <AiChip>{m("improve")}</AiChip>
              <AiChip tone="suggestion" size="M">
                {m("analyse")}
              </AiChip>
            </div>
          </Panel>
          <Panel title={m("danger")}>
            <div className="flex flex-wrap items-end gap-4">
              <Button variant="dangerOutline" size="M" icon={<Icon name="fermer" />}>
                {m("delete")}
              </Button>
              <Button variant="danger" size="M">
                {m("confirmDelete")}
              </Button>
            </div>
          </Panel>
        </div>
      </Section>

      <Section title={t("sections.mobileCards")}>
        <div id="gamme-cartes" className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <GoalCard
            eyebrow={m("goalEyebrow")}
            title={m("goalTitle")}
            editHref="/dev/composants"
            editLabel={m("goalEdit")}
            stats={[
              { value: 3, label: m("statApplications") },
              { value: 1, label: m("statInterviews") },
              { value: "80 %", label: m("statProfile") },
            ]}
          />
          <ProfileCard
            name={f("sampleUser")}
            subtitle={m("profileSubtitle")}
            skills={["Excel", "SQL", "Python"]}
            footer={<Switch id="demo-mobile-visible" label={m("visible")} checked />}
          />
          <div className="grid grid-cols-2 gap-3">
            <VisualTile
              href="/dev/composants"
              title={m("tileCv")}
              line={m("tileCvLine")}
              scene="cv"
              badge={m("fileKind")}
            />
            <VisualTile
              href="/dev/composants"
              title={m("tileInterview")}
              line={m("tileInterviewLine")}
              scene="interview"
              tone="menthe"
              badge="3/8"
              locked={m("tileLocked")}
            />
          </div>
          <AiBento
            title={m("aiTitle")}
            line={m("aiLine")}
            chips={[
              { icon: "doc", label: m("chipCv") },
              { icon: "message", label: m("chipInterview") },
              { icon: "jobs", label: m("chipJobs") },
            ]}
          />
          <div className="flex flex-col gap-3">
            <FileCard
              name={m("fileName")}
              meta={m("fileMeta")}
              kind={m("fileKind")}
              href="/dev/composants"
              downloadLabel={m("download")}
            />
            <SlotCard
              weekday={m("slotWeekday")}
              day={m("slotDay")}
              month={m("slotMonth")}
              title={m("slotTitle")}
              meta={m("slotMeta")}
              actions={
                <>
                  <Button variant="principal" size="S">
                    {m("accept")}
                  </Button>
                  <Button variant="soft" size="S">
                    {m("otherTime")}
                  </Button>
                </>
              }
            />
          </div>
          <DecisionCard
            outcome="rejected"
            company={f("sampleCompany")}
            job={m("decisionJob")}
            banner={m("rejectedBanner")}
            paragraphs={[m("rejectedHello"), m("rejectedBody")]}
            signer={m("signer")}
            date={m("decisionDate")}
          />
          <DecisionCard
            outcome="hired"
            company={f("sampleCompany")}
            job={m("decisionJob")}
            banner={m("hiredBanner")}
            paragraphs={[m("rejectedHello"), m("hiredBody")]}
            signer={m("signer")}
            date={m("decisionDate")}
          />
        </div>
      </Section>

      <Section title={t("sections.mobileStates")}>
        <div id="gamme-etats" className="grid gap-4 md:grid-cols-3">
          <Panel title={m("rest")}>
            <Pressable href="/dev/composants">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-lime">
                <Icon name="profil" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[14.5px] font-semibold">{m("rowTitle")}</span>
                <span className="text-[12.5px] text-ardoise">{m("rowLine")}</span>
              </span>
            </Pressable>
          </Panel>
          <Panel title={m("rowPressed")}>
            <Pressable href="/dev/composants" data-pressed="">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-lime">
                <Icon name="profil" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[14.5px] font-semibold">{m("rowTitle")}</span>
                <span className="text-[12.5px] text-ardoise">{m("rowLine")}</span>
              </span>
            </Pressable>
          </Panel>
          <Panel title={m("loading")}>
            <div
              className="jm-pressable flex min-h-14 items-center gap-3 rounded-[20px] p-3"
              data-loading=""
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-lime">
                <Icon name="profil" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[14.5px] font-semibold">{m("rowTitle")}</span>
                <span className="text-[12.5px] text-ardoise">{m("rowLine")}</span>
              </span>
              <PressArrow className="ml-auto" />
            </div>
          </Panel>
        </div>
      </Section>
    </>
  );
}
