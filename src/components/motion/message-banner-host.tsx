import { getTranslations } from "next-intl/server";
import { MessageBanner } from "./message-banner";

/** The banner of a new message with its words, beside the toasts of each space. */
export async function MessageBannerHost() {
  const t = await getTranslations("messageBanner");
  return (
    <MessageBanner
      labels={{
        // The name is put in on the device, when the message arrives.
        title: t("title", { name: "{name}" }),
        line: t("line"),
        region: t("region"),
        close: t("close"),
      }}
    />
  );
}
