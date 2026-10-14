import { getTranslations } from "next-intl/server";
import { Button, Select, TextArea } from "@/components/ui";
import { reportAction } from "@/server/actions/connect";
import { reportReasons, type reportTargets } from "@/server/services/moderation";

/** « Signaler » (partie 10 § 10.7): confidential, reviewed by the Jumanly team. */
export async function ReportForm({
  targetType,
  targetId,
  back,
}: {
  targetType: (typeof reportTargets)[number];
  targetId: string;
  back: string;
}) {
  const t = await getTranslations("report");
  const fieldId = `${targetType}-${targetId}`;
  return (
    <form action={reportAction} className="mt-3 flex flex-col gap-3 rounded-md bg-blanc p-4">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="back" value={back} />
      <p>{t("intro")}</p>
      <Select
        id={`reason-${fieldId}`}
        name="reason"
        required
        label={t("reason.text")}
        placeholder={t("reason.text")}
        defaultValue=""
        options={reportReasons.map((reason) => ({ value: reason, label: t(`reason.${reason}`) }))}
      />
      <TextArea
        id={`details-${fieldId}`}
        name="details"
        rows={3}
        maxLength={1000}
        label={t("details.text")}
        placeholder={t("details.placeholder")}
      />
      <p className="text-ardoise text-caption">{t("urgent")}</p>
      <Button type="submit" variant="tertiary" size="sm" className="self-start">
        {t("submit")}
      </Button>
    </form>
  );
}
