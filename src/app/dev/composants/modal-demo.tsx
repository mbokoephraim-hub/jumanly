"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";

export function ModalDemo() {
  const t = useTranslations("devComponents.modal");
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t("open")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("title")}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => setOpen(false)}>{t("confirm")}</Button>
          </>
        }
      >
        {t("text")}
      </Modal>
    </div>
  );
}
