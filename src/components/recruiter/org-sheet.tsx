import { switchSpace } from "@/server/actions/hire";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet } from "@/components/talent/sheet";
import { ORG_SHEET_ID } from "./header";
import { OrgMark } from "./org-mark";

export type OrgChoice = {
  id: string;
  name: string;
  logo: string | null;
  /** « Responsable · RH Pro », already written. */
  line: string;
};

/**
 * « Organisation active » (planche recruteur-1 r1), opened by the chip of the head: one line per
 * organization the person recruits for, the active one marked, then the way back to the talent
 * space. Choosing goes through `switchSpace`, which checks the membership again. On a computer or a
 * tablet it opens under the name in the sidebar, with the reminder that organizations are apart.
 */
export function OrgSheet({
  orgs,
  activeId,
  labels,
}: {
  orgs: OrgChoice[];
  activeId: string;
  labels: { title: string; close: string; current: string; talent: string; note: string };
}) {
  return (
    // On a computer or a tablet, a menu under the name of the organization (planche web recruteur-1).
    <Sheet id={ORG_SHEET_ID} title={labels.title} closeLabel={labels.close} className="t-rx-orgs">
      <ul className="t-orgs">
        {orgs.map((org) => {
          const active = org.id === activeId;
          return (
            <li key={org.id}>
              <form action={switchSpace}>
                <input type="hidden" name="space" value={org.id} />
                <button
                  type="submit"
                  className="t-verre t-li t-press w-full"
                  aria-current={active ? "true" : undefined}
                >
                  <OrgMark name={org.name} logo={org.logo} size="sm" />
                  <span className="t-t">
                    <b>{org.name}</b>
                    <span>{org.line}</span>
                  </span>
                  <span className="t-radio" aria-hidden />
                  {active && <span className="sr-only">{labels.current}</span>}
                </button>
              </form>
            </li>
          );
        })}
        <li>
          <form action={switchSpace}>
            <input type="hidden" name="space" value="personal" />
            <button type="submit" className="t-verre t-li t-press w-full">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="profil" size="s" />
              </span>
              <span className="t-t">
                <b>{labels.talent}</b>
              </span>
              <TalentIcon name="suivant" />
            </button>
          </form>
        </li>
      </ul>
      <p className="t-gar t-web">
        <TalentIcon name="confidentialite" size="s" />
        <span>{labels.note}</span>
      </p>
    </Sheet>
  );
}
