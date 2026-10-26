"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { cx } from "@/lib/cx";
import {
  assignTaskAction,
  cancelInvitationAction,
  inviteMemberAction,
  remindTaskAction,
  removeMemberAction,
  respondDeclaredAction,
  respondJoinAction,
  setMemberRightAction,
  setMemberRoleAction,
  type TeamActionResult,
} from "@/server/actions/org-team";

const RIGHTS = ["publish", "sort", "interviews", "evaluate", "stats", "page"] as const;
type Right = (typeof RIGHTS)[number];
type Role = "org_owner" | "org_admin" | "recruiter" | "hiring_manager" | "viewer";
type TaskStatus = "assigned" | "accepted" | "in_progress" | "done";
const STEPS: TaskStatus[] = ["assigned", "accepted", "in_progress", "done"];
const KINDS = ["follow", "diagnostic", "interview"] as const;

export type TeamData = {
  org: string;
  seatsLine: string;
  onlyYou: boolean;
  places: string;
  advanced: boolean;
  roles: Role[];
  inviteRoles: Role[];
  canInvite: boolean;
  members: {
    id: string;
    userId: string;
    name: string;
    role: Role;
    jobTitle: string | null;
    rights: Record<Right, boolean>;
    ceiling: Record<Right, boolean>;
    editable: boolean;
    assignable: boolean;
  }[];
  tasks: {
    id: string;
    kind: (typeof KINDS)[number];
    status: TaskStatus;
    due: string;
    late: boolean;
    assigneeId: string;
    assigneeName: string;
    applicationId: string;
    candidate: string;
  }[];
  requests: { id: string; name: string; domain: string }[];
  declared: { experienceId: string; name: string; title: string }[];
  invitations: { id: string; email: string; role: Role; date: string }[];
  applications: { id: string; name: string; job: string }[];
  dues: string[];
};

type Tab = "membres" | "taches" | "invitations";
type Filter = "toutes" | "cours" | "retard" | "fait";

const first = (name: string) => name.split(" ")[0] ?? name;

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : ""))
    .toUpperCase()
    .slice(0, 2);
}

/** Soft colours of the mockup's avatars, chosen by the name (never by who the person is). */
const PASTELS = [
  ["#FBE3EF", "#8A2D5C"],
  ["#E8F0D8", "#4F6B12"],
  ["#EDE3FB", "#5A2D8A"],
  ["#DDEFF7", "#1F5C7A"],
  ["#FBEBD8", "#8A4F12"],
] as const;
function pastel(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PASTELS[hash % PASTELS.length]!;
}

export function Avatar({ name, soft, small }: { name: string; soft?: boolean; small?: boolean }) {
  const [bg, fg] = soft ? pastel(name) : ["#1B3338", "#F2EDE5"];
  return (
    <span
      aria-hidden="true"
      className={small ? "ae-av ae-av-s" : "ae-av"}
      style={{ background: bg, color: fg }}
    >
      {initialsOf(name)}
    </span>
  );
}

/** A dark dialog on the native <dialog> (focus kept inside, Escape closes). */
export function AeDialog({
  open,
  onClose,
  title,
  width = 560,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className="ae-dialog"
      style={{ width }}
    >
      {open && (
        <div className="ae-app">
          <h2 id={titleId} className="ae-dialog-titre">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Toast({
  text,
  onClose,
  label,
}: {
  text: string;
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(timer);
  }, [text, onClose]);
  return (
    <div className="ae-app">
      <div role="status" className="ae-toast">
        <span>{text}</span>
        <button type="button" onClick={onClose} aria-label={label} className="ae-toast-x">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Switch({
  on,
  label,
  disabled,
  onToggle,
  title,
}: {
  on: boolean;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      title={title}
      onClick={onToggle}
      className={on ? "ae-sw ae-sw-on" : "ae-sw"}
    >
      <span />
    </button>
  );
}

const Plus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * Équipe (étape 3, A2, captures 076 à 078): « Membres et rôles », « Tâches », « Invitations et
 * demandes », with « Inviter un membre » and « Attribuer une tâche ». Every switch, button and
 * dialog writes in the organization and says what happened in a toast.
 */
export function TeamScreen({
  data,
  initialTab,
  inviting = false,
  assigning = false,
}: {
  data: TeamData;
  initialTab: Tab;
  /** `?inviter=1`: the page opens on « Inviter un membre ». */
  inviting?: boolean;
  /** `?attribuer=1` (« Attribuer une tâche » of the home, lot N1): opens on that dialog. */
  assigning?: boolean;
}) {
  const t = useTranslations("orgTeam");
  const [tab, setTab] = useState<Tab>(initialTab);
  const others = data.members.filter((member) => member.editable || member.assignable);
  const [selectedId, setSelectedId] = useState(others[0]?.id ?? "");
  const selected = data.members.find((member) => member.id === selectedId) ?? others[0];
  const [filter, setFilter] = useState<Filter>("toutes");
  const [dialog, setDialog] = useState<null | "invite" | "assign" | "remove">(
    inviting ? "invite" : assigning ? "assign" : null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const tabsId = useId();

  const act = (work: () => Promise<TeamActionResult>, after?: () => void) =>
    start(async () => {
      const result = await work();
      setToast(result.text);
      if (result.ok) after?.();
    });

  const openTasks = data.tasks.filter((task) => task.status !== "done").length;
  const pendingCount = data.requests.length + data.declared.length + data.invitations.length;
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "membres", label: t("tabs.members") },
    { key: "taches", label: t("tabs.tasks"), count: openTasks },
    { key: "invitations", label: t("tabs.invitations"), count: pendingCount },
  ];

  return (
    <div className="ae-app ae-page" aria-busy={pending}>
      <h1 className="ae-h1">{t("title")}</h1>
      <div className="ae-entete">
        <p className="ae-meta ae-grandit">
          {data.seatsLine} {data.onlyYou ? t("onlyYou") : t("admins")}
        </p>
        <Link href="/app/organisation/structure" className="ae-btn2 ae-btn-m">
          {t("structure")}
        </Link>
        <button type="button" className="ae-btn2 ae-btn-m" onClick={() => setDialog("invite")}>
          {t("invite")}
        </button>
        <button type="button" className="ae-btn ae-btn-m" onClick={() => setDialog("assign")}>
          <Plus />
          {t("assign")}
        </button>
      </div>

      <div role="tablist" aria-label={t("tabs.aria")} className="ae-seg">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${tabsId}-${item.key}`}
            aria-selected={tab === item.key}
            aria-controls={`${tabsId}-${item.key}-panel`}
            onClick={() => setTab(item.key)}
            className={tab === item.key ? "ae-seg-on" : undefined}
          >
            {item.label}
            {item.count ? <span className="ae-seg-n">{item.count}</span> : null}
            {tab === item.key && <i aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${tabsId}-${tab}-panel`}
        aria-labelledby={`${tabsId}-${tab}`}
        className="ae-panneau"
      >
        {tab === "membres" &&
          (selected ? (
            <Members
              data={data}
              selected={selected}
              onSelect={setSelectedId}
              act={act}
              onRemove={() => setDialog("remove")}
            />
          ) : (
            <div className="ae-carte ae-vide">
              <p>{t("member.alone")}</p>
              <button type="button" className="ae-btn ae-btn-m" onClick={() => setDialog("invite")}>
                {t("invite")}
              </button>
            </div>
          ))}
        {tab === "taches" && (
          <Tasks
            data={data}
            filter={filter}
            onFilter={setFilter}
            act={act}
            onAssign={() => setDialog("assign")}
          />
        )}
        {tab === "invitations" && (
          <Invitations data={data} act={act} onInvite={() => setDialog("invite")} />
        )}
      </div>

      <InviteDialog
        open={dialog === "invite"}
        data={data}
        onClose={() => setDialog(null)}
        act={act}
        onSent={() => {
          setDialog(null);
          setTab("invitations");
        }}
      />
      <AssignDialog
        // Opened again on the member shown in « Membres et rôles ».
        key={dialog === "assign" ? `ouvert-${selected?.id ?? ""}` : "ferme"}
        open={dialog === "assign"}
        data={data}
        preset={selected?.assignable ? selected.userId : undefined}
        onClose={() => setDialog(null)}
        act={act}
        onDone={(member) => {
          setDialog(null);
          const target = data.members.find((item) => item.userId === member);
          if (target) setSelectedId(target.id);
        }}
      />
      {selected && (
        <AeDialog
          open={dialog === "remove"}
          onClose={() => setDialog(null)}
          title={t("remove.title", { name: selected.name })}
          width={520}
        >
          <p className="ae-meta ae-dialog-texte">
            {t("remove.text", { name: first(selected.name) })}
          </p>
          <div className="ae-dialog-actions">
            <button type="button" className="ae-btn2 ae-btn-m" onClick={() => setDialog(null)}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className="ae-btn ae-btn-m"
              disabled={pending}
              onClick={() =>
                act(
                  () => removeMemberAction(selected.id),
                  () => {
                    setDialog(null);
                    setSelectedId("");
                  },
                )
              }
            >
              {t("remove.confirm")}
            </button>
          </div>
        </AeDialog>
      )}
      {toast && <Toast text={toast} onClose={() => setToast(null)} label={t("close")} />}
    </div>
  );
}

type Act = (work: () => Promise<TeamActionResult>, after?: () => void) => void;

function useDate() {
  const format = useFormatter();
  return (iso: string) => {
    const text = format.dateTime(new Date(iso), {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
}

function Steps({ status }: { status: TaskStatus }) {
  const t = useTranslations("orgTeam");
  const index = STEPS.indexOf(status);
  return (
    <ol
      className="ae-etapes"
      aria-label={t("task.progress", { status: t(`task.status.${status}`) })}
    >
      {STEPS.map((step, i) => (
        <li key={step} className={i <= index ? "ae-etape-on" : undefined}>
          <span aria-hidden="true" />
          <span className={i === index ? "ae-etape-ici" : undefined}>
            {t(`task.status.${step}`)}
          </span>
        </li>
      ))}
    </ol>
  );
}

const statusTone = (status: TaskStatus) =>
  status === "done" ? "ae-st-fait" : status === "assigned" ? "ae-st-attente" : "ae-st-cours";

function TaskActions({ task, act }: { task: TeamData["tasks"][number]; act: Act }) {
  const t = useTranslations("orgTeam");
  return (
    <span className="ae-actions-ligne">
      <Link
        href={`/app/hire/candidats/${task.applicationId}`}
        className="ae-btn2 ae-btn-s"
        aria-label={t("task.fileAria", { candidate: task.candidate })}
      >
        {t("task.file")}
      </Link>
      {task.status !== "done" && (
        <button
          type="button"
          className="ae-btn2 ae-btn-s"
          aria-label={t("task.remindAria", { name: task.assigneeName })}
          onClick={() => act(() => remindTaskAction(task.id))}
        >
          {t("task.remind")}
        </button>
      )}
    </span>
  );
}

function Members({
  data,
  selected,
  onSelect,
  act,
  onRemove,
}: {
  data: TeamData;
  selected: TeamData["members"][number];
  onSelect: (id: string) => void;
  act: Act;
  onRemove: () => void;
}) {
  const t = useTranslations("orgTeam");
  const date = useDate();
  const visible = data.members.filter((member) => member.editable || member.assignable);
  const tasksOf = (userId: string) => data.tasks.filter((task) => task.assigneeId === userId);
  const roleName = (role: Role) => t(`roles.${role}.name`);
  const mine = tasksOf(selected.userId);
  const adminLike = selected.role === "org_admin" || selected.role === "org_owner";
  return (
    <>
      <div className="ae-g3">
        {visible.map((member) => {
          const list = tasksOf(member.userId);
          const done = list.filter((task) => task.status === "done").length;
          const count = RIGHTS.filter((right) => member.rights[right]).length;
          const on = member.id === selected.id;
          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(member.id)}
              className={on ? "ae-carte ae-membre ae-membre-on" : "ae-carte ae-membre"}
            >
              <span className="ae-ligne">
                <Avatar name={member.name} />
                <span className="ae-grandit">
                  <b className="ae-nom">{member.name}</b>
                  <span className="ae-meta">
                    {[roleName(member.role), member.jobTitle].filter(Boolean).join(" · ")}
                    {" · "}
                    {t("member.rights", { count, total: RIGHTS.length })}
                  </span>
                </span>
              </span>
              <span className="ae-ligne-taches">
                <span className="ae-meta">{t("member.tasks")}</span>
                <b>{t("member.done", { done, total: list.length })}</b>
              </span>
              <span className="ae-jauge" aria-hidden="true">
                <i
                  style={{ width: `${list.length ? Math.round((done / list.length) * 100) : 0}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="ae-deux">
        <section className="ae-carte ae-role" aria-labelledby="ae-role-titre">
          <h2 id="ae-role-titre" className="ae-h2">
            {t("role.title", { name: first(selected.name) })}
          </h2>
          <p className="ae-meta ae-sous-titre">
            {t("role.subtitle", {
              line: [roleName(selected.role), selected.jobTitle].filter(Boolean).join(" · "),
              name: first(selected.name),
            })}
          </p>
          <span className="ae-lab">{t("role.current", { role: roleName(selected.role) })}</span>
          {selected.editable && !adminLike ? (
            <div
              role="radiogroup"
              aria-label={t("role.current", { role: roleName(selected.role) })}
              className="ae-roles"
            >
              {data.roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={selected.role === role}
                  className={selected.role === role ? "ae-role-opt ae-role-on" : "ae-role-opt"}
                  onClick={() =>
                    selected.role !== role &&
                    act(() => setMemberRoleAction({ membershipId: selected.id, role }))
                  }
                >
                  <b>{roleName(role)}</b>
                  <span className="ae-meta">{t(`roles.${role}.text`)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="ae-meta">{t("role.fixed")}</p>
          )}
          <span className="ae-lab">{t("rights.title", { name: first(selected.name) })}</span>
          {RIGHTS.map((right) => {
            const label = t(`rights.${right}`, { org: data.org });
            const allowed = selected.ceiling[right];
            const locked = !selected.editable || adminLike || !data.advanced || !allowed;
            return (
              <div key={right} className="ae-droit">
                <span className="ae-grandit">{label}</span>
                <Switch
                  on={selected.rights[right]}
                  label={label}
                  disabled={locked}
                  title={
                    !allowed ? t("rights.beyond", { role: roleName(selected.role) }) : undefined
                  }
                  onToggle={() =>
                    act(() =>
                      setMemberRightAction({
                        membershipId: selected.id,
                        right,
                        on: !selected.rights[right],
                      }),
                    )
                  }
                />
              </div>
            );
          })}
          <p className="ae-meta ae-note">{data.advanced ? t("rights.note") : t("rights.basic")}</p>
          {selected.editable && (
            <button type="button" className="ae-lien-doux" onClick={onRemove}>
              {t("remove.button")}
            </button>
          )}
        </section>

        <section className="ae-grandit ae-taches-membre" aria-labelledby="ae-taches-titre">
          <h2 id="ae-taches-titre" className="ae-h2">
            {t("memberTasks.title", { name: first(selected.name) })}
          </h2>
          {mine.length === 0 ? (
            <p className="ae-meta">{t("memberTasks.empty")}</p>
          ) : (
            <ul className="ae-liste-taches">
              {mine.map((task) => (
                <li key={task.id} className="ae-carte ae-tache">
                  <div className="ae-ligne">
                    <span className="ae-grandit">
                      <b className="ae-nom">
                        {t("task.line", {
                          kind: t(`task.kind.${task.kind}`),
                          candidate: task.candidate,
                        })}
                      </b>
                      <span className="ae-meta">{t("task.due", { date: date(task.due) })}</span>
                    </span>
                    <b className={cx("ae-statut", statusTone(task.status))}>
                      {t(`task.status.${task.status}`)}
                    </b>
                    <TaskActions task={task} act={act} />
                  </div>
                  <Steps status={task.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Tasks({
  data,
  filter,
  onFilter,
  act,
  onAssign,
}: {
  data: TeamData;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  act: Act;
  onAssign: () => void;
}) {
  const t = useTranslations("orgTeam");
  const date = useDate();
  const filters: { key: Filter; label: string }[] = [
    { key: "toutes", label: t("tasks.all") },
    { key: "cours", label: t("tasks.open") },
    { key: "retard", label: t("tasks.late") },
    { key: "fait", label: t("tasks.done") },
  ];
  const shown = data.tasks.filter((task) =>
    filter === "toutes"
      ? true
      : filter === "cours"
        ? task.status !== "done"
        : filter === "fait"
          ? task.status === "done"
          : task.late,
  );
  if (data.tasks.length === 0)
    return (
      <div className="ae-carte ae-vide">
        <p>{t("tasks.none")}</p>
        <button type="button" className="ae-btn ae-btn-m" onClick={onAssign}>
          <Plus />
          {t("assign")}
        </button>
      </div>
    );
  return (
    <>
      <div className="ae-pills" role="group" aria-label={t("tasks.filters")}>
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            className="ae-pill"
            aria-pressed={filter === item.key}
            onClick={() => onFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <table className="ae-table">
        <caption className="ae-sr">{t("tasks.caption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("tasks.col.task")}</th>
            <th scope="col">{t("tasks.col.candidate")}</th>
            <th scope="col">{t("tasks.col.member")}</th>
            <th scope="col">{t("tasks.col.due")}</th>
            <th scope="col">{t("tasks.col.progress")}</th>
            <th scope="col">
              <span className="ae-sr">{t("tasks.col.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((task) => {
            const index = STEPS.indexOf(task.status);
            return (
              <tr key={task.id}>
                <th scope="row">{t(`task.kind.${task.kind}`)}</th>
                <td>{task.candidate}</td>
                <td>
                  <span className="ae-ligne ae-ligne-s">
                    <Avatar name={task.assigneeName} small />
                    {first(task.assigneeName)}
                  </span>
                </td>
                <td>
                  <span className="ae-meta ae-bloc">{date(task.due)}</span>
                  {task.late && <b className="ae-retard">{t("task.late")}</b>}
                </td>
                <td>
                  <b className={cx("ae-statut", statusTone(task.status))}>
                    {t(`task.status.${task.status}`)}
                  </b>
                  <span className="ae-jauge" aria-hidden="true">
                    <i style={{ width: `${Math.round((index / 3) * 100)}%` }} />
                  </span>
                </td>
                <td>
                  <TaskActions task={task} act={act} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {shown.length === 0 && <p className="ae-meta ae-vide-ligne">{t("tasks.empty")}</p>}
    </>
  );
}

function Invitations({ data, act, onInvite }: { data: TeamData; act: Act; onInvite: () => void }) {
  const t = useTranslations("orgTeam");
  const format = useFormatter();
  return (
    <div className="ae-deux ae-deux-haut">
      <section className="ae-carte ae-grandit-13" aria-labelledby="ae-demandes-titre">
        <h2 id="ae-demandes-titre" className="ae-h2">
          {t("requests.title")}
        </h2>
        <p className="ae-meta ae-sous-titre">{t("requests.subtitle", { org: data.org })}</p>
        {data.requests.length + data.declared.length === 0 ? (
          <p className="ae-meta">{t("requests.empty")}</p>
        ) : (
          <ul>
            {data.requests.map((request) => (
              <li key={request.id} className="ae-rangee">
                <Avatar name={request.name} soft />
                <span className="ae-grandit">
                  <b className="ae-nom">{request.name}</b>
                  <span className="ae-meta">{t("requests.join", { domain: request.domain })}</span>
                </span>
                <button
                  type="button"
                  className="ae-btn2 ae-btn-s"
                  aria-label={t("requests.refuseAria", { name: request.name })}
                  onClick={() =>
                    act(() => respondJoinAction({ requestId: request.id, accept: false }))
                  }
                >
                  {t("requests.refuse")}
                </button>
                <button
                  type="button"
                  className="ae-btn ae-btn-s"
                  aria-label={t("requests.acceptAria", { name: request.name })}
                  onClick={() =>
                    act(() => respondJoinAction({ requestId: request.id, accept: true }))
                  }
                >
                  {t("requests.accept")}
                </button>
              </li>
            ))}
            {data.declared.map((person) => (
              <li key={person.experienceId} className="ae-rangee">
                <Avatar name={person.name} soft />
                <span className="ae-grandit">
                  <b className="ae-nom">{person.name}</b>
                  <span className="ae-meta">
                    {t("requests.declared", { org: data.org, title: person.title })}
                  </span>
                </span>
                <button
                  type="button"
                  className="ae-btn2 ae-btn-s"
                  aria-label={t("requests.notHereAria", { name: person.name, org: data.org })}
                  onClick={() =>
                    act(() =>
                      respondDeclaredAction({ experienceId: person.experienceId, confirm: false }),
                    )
                  }
                >
                  {t("requests.notHere")}
                </button>
                <button
                  type="button"
                  className="ae-btn ae-btn-s"
                  aria-label={t("requests.confirmAria", { name: person.name, org: data.org })}
                  onClick={() =>
                    act(() =>
                      respondDeclaredAction({ experienceId: person.experienceId, confirm: true }),
                    )
                  }
                >
                  {t("requests.confirm")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="ae-carte ae-grandit" aria-labelledby="ae-invitations-titre">
        <div className="ae-ligne">
          <h2 id="ae-invitations-titre" className="ae-h2 ae-grandit">
            {t("invitations.title")}
          </h2>
          <button type="button" className="ae-btn ae-btn-s" onClick={onInvite}>
            {t("invitations.invite")}
          </button>
        </div>
        {data.invitations.length === 0 ? (
          <p className="ae-meta ae-vide-ligne">{t("invitations.empty")}</p>
        ) : (
          <ul>
            {data.invitations.map((invitation) => (
              <li key={invitation.id} className="ae-rangee">
                <span className="ae-grandit">
                  <b className="ae-nom">{invitation.email}</b>
                  <span className="ae-meta">
                    {t("invitations.line", {
                      role: t(`roles.${invitation.role}.name`),
                      date: format.dateTime(new Date(invitation.date), {
                        day: "numeric",
                        month: "long",
                      }),
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  className="ae-btn2 ae-btn-s"
                  aria-label={t("invitations.resendAria", { email: invitation.email })}
                  onClick={() =>
                    act(() =>
                      inviteMemberAction({
                        email: invitation.email,
                        role: invitation.role,
                        resend: true,
                      }),
                    )
                  }
                >
                  {t("invitations.resend")}
                </button>
                <button
                  type="button"
                  className="ae-btn2 ae-btn-s ae-doux"
                  aria-label={t("invitations.cancelAria", { email: invitation.email })}
                  onClick={() => act(() => cancelInvitationAction(invitation.id))}
                >
                  {t("invitations.cancel")}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="ae-meta ae-note">{data.places}</p>
      </section>
    </div>
  );
}

function InviteDialog({
  open,
  data,
  onClose,
  act,
  onSent,
}: {
  open: boolean;
  data: TeamData;
  onClose: () => void;
  act: Act;
  onSent: () => void;
}) {
  const t = useTranslations("orgTeam");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(data.inviteRoles[0] ?? "recruiter");
  const [error, setError] = useState("");
  const errorId = useId();
  const send = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("inviteDialog.error.invalid"));
      return;
    }
    setError("");
    act(
      () => inviteMemberAction({ email, role }),
      () => {
        setEmail("");
        onSent();
      },
    );
  };
  return (
    <AeDialog open={open} onClose={onClose} title={t("inviteDialog.title")}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label className="ae-lab" htmlFor="ae-invite-email">
          {t("inviteDialog.email")}
        </label>
        <input
          id="ae-invite-email"
          type="email"
          className="ae-in"
          value={email}
          autoComplete="off"
          placeholder={t("inviteDialog.placeholder")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && (
          <p id={errorId} className="ae-erreur">
            {error}
          </p>
        )}
        <span className="ae-lab" id="ae-invite-role">
          {t("inviteDialog.role")}
        </span>
        <div role="radiogroup" aria-labelledby="ae-invite-role" className="ae-pills">
          {data.inviteRoles.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={role === item}
              className="ae-pill"
              onClick={() => setRole(item)}
            >
              {t(`roles.${item}.name`)}
            </button>
          ))}
        </div>
        <p className="ae-meta ae-note">{data.places}</p>
        <div className="ae-dialog-actions">
          <button type="button" className="ae-btn2 ae-btn-m" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="submit" className="ae-btn ae-btn-m">
            {t("inviteDialog.send")}
          </button>
        </div>
      </form>
    </AeDialog>
  );
}

function AssignDialog({
  open,
  data,
  preset,
  onClose,
  act,
  onDone,
}: {
  open: boolean;
  data: TeamData;
  preset?: string;
  onClose: () => void;
  act: Act;
  onDone: (member: string) => void;
}) {
  const t = useTranslations("orgTeam");
  const date = useDate();
  const members = data.members.filter((member) => member.assignable);
  const [member, setMember] = useState(preset ?? members[0]?.userId ?? "");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("interview");
  const [application, setApplication] = useState(data.applications[0]?.id ?? "");
  const [due, setDue] = useState(data.dues[0] ?? "");
  const group = (label: string, children: ReactNode) => (
    <>
      <span className="ae-lab">{label}</span>
      <div role="radiogroup" aria-label={label} className="ae-pills ae-pills-wrap">
        {children}
      </div>
    </>
  );
  const pill = (on: boolean, label: string, pick: () => void, key: string) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={on}
      className="ae-pill"
      onClick={pick}
    >
      {label}
    </button>
  );
  const ready = members.length > 0 && data.applications.length > 0;
  return (
    <AeDialog open={open} onClose={onClose} title={t("assignDialog.title")} width={600}>
      {members.length === 0 ? (
        <p className="ae-meta ae-dialog-texte">{t("assignDialog.noMember")}</p>
      ) : data.applications.length === 0 ? (
        <p className="ae-meta ae-dialog-texte">{t("assignDialog.noCandidate")}</p>
      ) : (
        <>
          {group(
            t("assignDialog.who"),
            members.map((item) =>
              pill(member === item.userId, item.name, () => setMember(item.userId), item.userId),
            ),
          )}
          {group(
            t("assignDialog.what"),
            KINDS.map((item) =>
              pill(kind === item, t(`task.kind.${item}`), () => setKind(item), item),
            ),
          )}
          {group(
            t("assignDialog.candidate"),
            data.applications.map((item) =>
              pill(
                application === item.id,
                t("assignDialog.candidateLine", { name: item.name, job: item.job }),
                () => setApplication(item.id),
                item.id,
              ),
            ),
          )}
          {group(
            t("assignDialog.due"),
            data.dues.map((item) =>
              pill(due === item, date(`${item}T12:00:00.000Z`), () => setDue(item), item),
            ),
          )}
          <p className="ae-meta ae-note">{t("assignDialog.note")}</p>
        </>
      )}
      <div className="ae-dialog-actions">
        <button type="button" className="ae-btn2 ae-btn-m" onClick={onClose}>
          {t("cancel")}
        </button>
        {ready && (
          <button
            type="button"
            className="ae-btn ae-btn-m"
            onClick={() =>
              act(
                () => assignTaskAction({ member, kind, application, due }),
                () => onDone(member),
              )
            }
          >
            {t("assignDialog.confirm")}
          </button>
        )}
      </div>
    </AeDialog>
  );
}
