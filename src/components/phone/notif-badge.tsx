import type { NotificationKind } from "@/lib/notification-models";
import { PhoneIcon } from "./icon";

/** What a row shows of its model: the kind (badge colour), its icon, the title, the button. */
export type NotifModelView = {
  kind: NotificationKind;
  icon: string;
  title: string;
  action: string | null;
};

/** The small round badge on the photo, coloured by kind. */
export function NotifBadge({ model }: { model: NotifModelView }) {
  return (
    <span className="nb-nm-badge" data-kind={model.kind} aria-hidden>
      <PhoneIcon name={model.icon as Parameters<typeof PhoneIcon>[0]["name"]} size={12} />
    </span>
  );
}
