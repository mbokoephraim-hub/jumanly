import { getTranslations } from "next-intl/server";
import "server-only";
import { KIND_ICONS, notificationModel } from "@/lib/notification-models";
import type { NotifModelView } from "./notif-badge";

export async function notifModelOf(): Promise<(type: string) => NotifModelView> {
  const t = await getTranslations("notifModels");
  return (type) => {
    const model = notificationModel(type);
    return {
      kind: model.kind,
      icon: KIND_ICONS[model.kind],
      title: t(`title.${model.title}`),
      action: model.action ? t(`action.${model.action}`) : null,
    };
  };
}
