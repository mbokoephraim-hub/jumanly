"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FilterChip } from "@/components/ui/filter-chip";
import { Modal } from "@/components/ui/modal";
import { Toast, ToastRegion } from "@/components/ui/toast";

export function ModalDemo() {
  const t = useTranslations("devComponents.modal");
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="tertiary" onClick={() => setOpen(true)}>
        {t("open")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("title")}
        actions={
          <>
            <Button variant="tertiary" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("confirm")}
            </Button>
          </>
        }
      >
        {t("text")}
      </Modal>
    </div>
  );
}

export function DrawerDemo() {
  const t = useTranslations("devComponents");
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="tertiary" onClick={() => setOpen(true)}>
        {t("drawer.open")}
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t("drawer.title")}
        footer={
          <Button fullWidth onClick={() => setOpen(false)}>
            {t("drawer.apply")}
          </Button>
        }
      >
        <p className="text-[15px] leading-6 text-ardoise">{t("drawer.text")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip id="drawer-remote" label={t("search.filterRemote")} />
          <FilterChip id="drawer-full-time" label={t("search.filterFullTime")} />
        </div>
      </Drawer>
    </div>
  );
}

export function ToastDemo() {
  const t = useTranslations();
  const [shown, setShown] = useState(false);
  return (
    <div>
      <Button variant="tertiary" onClick={() => setShown(true)}>
        {t("devComponents.toast.show")}
      </Button>
      {/* Static example, always visible on this page. */}
      <div className="mt-4 max-w-md">
        <Toast
          message={t("toast.deleted.text")}
          action={
            <Button variant="primary" size="sm">
              {t("toast.undo")}
            </Button>
          }
        />
      </div>
      <ToastRegion>
        {shown && <Toast message={t("toast.saved")} onClose={() => setShown(false)} />}
      </ToastRegion>
    </div>
  );
}
