"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { cx } from "@/lib/cx";
import {
  advanceTaskAction,
  remindTaskAction,
  respondDeclaredAction,
  respondJoinAction,
  type TeamActionResult,
} from "@/server/actions/org-team";

function useAct() {
  const [pending, start] = useTransition();
  const act = (work: () => Promise<TeamActionResult>) =>
    start(async () => {
      const result = await work();
      showToast({ message: result.text, tone: result.ok ? "success" : "error" });
    });
  return { pending, act };
}

/** « Accepter », « Commencer », « Marquer comme terminée » of « Mes tâches » on the home. */
export function TaskStepButton({
  taskId,
  label,
  aria,
}: {
  taskId: string;
  label: string;
  aria?: string;
}) {
  const { pending, act } = useAct();
  return (
    <button
      type="button"
      className="rb-btn rb-s t-press"
      aria-label={aria}
      disabled={pending}
      onClick={() => act(() => advanceTaskAction(taskId))}
    >
      {label}
    </button>
  );
}

/** « Relancer » a member about a task (administrators). */
export function RemindButton({
  taskId,
  label,
  aria,
}: {
  taskId: string;
  label: string;
  aria: string;
}) {
  const { pending, act } = useAct();
  return (
    <button
      type="button"
      className="rb-btn2 rb-s t-press"
      aria-label={aria}
      disabled={pending}
      onClick={() => act(() => remindTaskAction(taskId))}
    >
      {label}
    </button>
  );
}

/** The two answers to a request: to join the team, or a person who says they work here. */
export function RequestButtons({
  kind,
  id,
  labels,
}: {
  kind: "join" | "declared";
  id: string;
  labels: { no: string; yes: string; noAria: string; yesAria: string };
}) {
  const { pending, act } = useAct();
  const answer = (yes: boolean) =>
    act(() =>
      kind === "join"
        ? respondJoinAction({ requestId: id, accept: yes })
        : respondDeclaredAction({ experienceId: id, confirm: yes }),
    );
  return (
    <>
      <button
        type="button"
        className="rb-btn2 rb-s t-press"
        aria-label={labels.noAria}
        disabled={pending}
        onClick={() => answer(false)}
      >
        {labels.no}
      </button>
      <button
        type="button"
        className="rb-btn rb-s t-press"
        aria-label={labels.yesAria}
        disabled={pending}
        onClick={() => answer(true)}
      >
        {labels.yes}
      </button>
    </>
  );
}

/**
 * « Bienvenue » (captures 031 and 074), the first time the space opens after the first steps
 * (`?bienvenue=1`): « Commencer » closes it and leaves the home as it is.
 */
export function WelcomeDialog({
  title,
  start,
  children,
}: {
  title: string;
  start: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const close = () => {
    dialog.current?.close();
    router.replace("/app/hire", { scroll: false });
  };
  return (
    <dialog
      ref={dialog}
      className="rb-modal"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="rb-boite">
        {children}
        <button type="button" className={cx("rb-btn t-press")} onClick={close} autoFocus>
          {start}
        </button>
      </div>
    </dialog>
  );
}
