import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { loose } from "@/lib/loose-t";
import { hv3RespondDeclaredAction } from "@/server/actions/hire-v3-company";
import type { CompanyOverview } from "@/server/services/hire-v3-company";
import { avatarColor, initialsOf } from "./avatar";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";
import { HireShareButton } from "./share-button";

export type CompanyTab = "overview" | "edit" | "members";
export const COMPANY_TABS: Record<CompanyTab, string> = {
  overview: "apercu",
  edit: "modifier",
  members: "membres",
};
const PAGE = "/app/hire/entreprise";
const EDIT = "/app/hire/entreprise/profil";
const BANNER: Record<string, string> = {
  sapin: "#0F3F37",
  nuit: "#14213D",
  lime: "#A6F26B",
  creme: "#F4EBDD",
};

type Query = Record<string, string | string[] | undefined>;

/** The cover of the page (`.ecov` of the prototype): banner, logo, name, chips and the two actions. */
async function Cover({ data }: { data: CompanyOverview }) {
  const t = await getTranslations("hireV3Company");
  const { org } = data;
  const bg = org.banner
    ? {
        backgroundImage: `url(${org.banner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : org.bannerTheme && BANNER[org.bannerTheme]
      ? { background: BANNER[org.bannerTheme] }
      : undefined;
  const tags: { icon: HireIconName; text: string }[] = [];
  if (org.sector) tags.push({ icon: "briefcase", text: org.sector });
  if (org.city) tags.push({ icon: "pin", text: org.city });
  if (org.size) tags.push({ icon: "users", text: org.size });
  const publicPath = `/entreprises/${org.slug}`;
  return (
    <div className="ecov">
      <div className="ecov-bg" style={bg} />
      <div className="eid">
        <span className="elogo">
          {org.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo} alt="" width={72} height={72} style={{ borderRadius: "inherit" }} />
          ) : (
            initialsOf(org.name)
          )}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2>{org.name}</h2>
          {org.website ? (
            <p>{t("website", { site: org.website.replace(/^https?:\/\//, "") })}</p>
          ) : null}
          <div className="etags">
            {tags.map((tag) => (
              <span key={tag.icon}>
                <HireIcon name={tag.icon} size="s" />
                {tag.text}
              </span>
            ))}
            {org.verifiedAt ? (
              <span className="ok">
                <HireIcon name="check" size="s" />
                {t("verified")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="eact">
          <HireShareButton
            path={publicPath}
            label={t("copy")}
            done={t("copied")}
            wide
            className="btn sm ghost eon"
          />
          <Link className="btn sm pri" href={publicPath} target="_blank">
            <HireIcon name="eye" size="s" />
            {t("public")}
          </Link>
        </div>
      </div>
    </div>
  );
}

async function Overview({ data }: { data: CompanyOverview }) {
  const t = await getTranslations("hireV3Company");
  const to = await getTranslations("hireV3Offers");
  const tx = await getTranslations("hireV3Export");
  const lo = loose(to);
  const lx = loose(tx);
  const kpis: [HireIconName, number, string, string][] = [
    ["heart", data.followers, t("kpi.followers"), t("kpi.followersSub")],
    ["offres", data.liveCount, t("kpi.live"), t("kpi.liveSub")],
    ["file", data.applications, t("kpi.applications"), t("kpi.applicationsSub")],
    ["users", data.team.length, t("kpi.team"), t("kpi.teamSub")],
  ];
  return (
    <>
      <Cover data={data} />
      <div className="ekpi">
        {kpis.map(([icon, value, label, sub]) => (
          <div className="ek" key={label}>
            <span className="ek-i">
              <HireIcon name={icon} size="s" />
            </span>
            <b>{value}</b>
            <span>{label}</span>
            <em>{sub}</em>
          </div>
        ))}
      </div>
      <div className="egrid">
        <div className="ecard">
          <div className="row">
            <h3>{t("about")}</h3>
            {data.canEdit ? (
              <Link className="lnk" style={{ marginLeft: "auto" }} href={EDIT}>
                {t("edit")}
              </Link>
            ) : null}
          </div>
          <p className="etxt" style={{ whiteSpace: "pre-line" }}>
            {data.org.description?.trim() || t("noDescription")}
          </p>
          <h4 className="eh4">{t("team")}</h4>
          <div className="eteam">
            {data.team.map((member) => (
              <div key={member.id}>
                <span className={`av ${avatarColor(member.name)}`} aria-hidden="true">
                  {initialsOf(member.name)}
                </span>
                <b>{member.name.split(" ")[0]}</b>
                <span className="meta">{member.title ?? lx(`role.${member.role}`)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ecard">
          <div className="row">
            <h3>{t("offers")}</h3>
            <Link className="lnk" style={{ marginLeft: "auto" }} href="/app/hire/offres">
              {t("allOffers")}
            </Link>
          </div>
          {data.offers.length ? (
            <div className="eoffs">
              {data.offers.map((offer) => (
                <Link className="eo" key={offer.id} href={`/app/hire/offres/${offer.id}`}>
                  {offer.department ? <span className="eo-d">{offer.department.name}</span> : null}
                  <b>{offer.title}</b>
                  <span className="meta">
                    {t("offerLine", {
                      city: offer.city ?? lo(`remote.${offer.remote}`),
                      contract: lo(`contract.${offer.contractType}`),
                    })}
                  </span>
                  <em>
                    {offer.daysLeft === null ? t("noEnd") : t("daysLeft", { days: offer.daysLeft })}
                    <HireIcon name="chev" size="s" />
                  </em>
                </Link>
              ))}
            </div>
          ) : (
            <p className="meta">{t("noOffers")}</p>
          )}
          <div className="ect">
            <HireIcon name="mail" size="s" />
            {t("contact")}
          </div>
        </div>
      </div>
    </>
  );
}

async function Edit({ data }: { data: CompanyOverview }) {
  const t = await getTranslations("hireV3Company");
  return (
    <div className="egrid2">
      <div className="ecard">
        <h3>{t("editTitle")}</h3>
        <p className="meta" style={{ margin: "6px 0 16px" }}>
          {data.canEdit ? t("editText") : t("editForbidden")}
        </p>
        {data.canEdit ? (
          <Link className="btn sm pri" href={EDIT}>
            <HireIcon name="edit" size="s" />
            {t("editOpen")}
          </Link>
        ) : null}
      </div>
      <div className="ecard">
        <Cover data={data} />
        <p
          className="meta"
          style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}
        >
          <HireIcon name="shield" size="s" />
          {t("noPhone")}
        </p>
      </div>
    </div>
  );
}

async function Members({ data, query }: { data: CompanyOverview; query: Query }) {
  const t = await getTranslations("hireV3Company");
  const name = typeof query.nom === "string" ? query.nom.slice(0, 80) : "";
  const flash =
    query.ok === "confirmed"
      ? t("flash.confirmed", { name })
      : query.ok === "rejected"
        ? t("flash.rejected", { name })
        : query.erreur
          ? t("flash.error")
          : null;
  return (
    <div className="ecard">
      {flash ? (
        <p className="meta" role="status" style={{ margin: "0 0 12px", fontWeight: 600 }}>
          {flash}
        </p>
      ) : null}
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>{t("membersTitle")}</h3>
        <span className="pill p-n">{data.declared.length}</span>
        <span className="meta" style={{ marginLeft: "auto" }}>
          {t("membersHint")}
        </span>
      </div>
      {data.declared.length ? (
        <div className="emem">
          {data.declared.map((person) => (
            <div className="emr" key={person.experienceId}>
              <span className={`av ${avatarColor(person.name)}`} aria-hidden="true">
                {initialsOf(person.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{person.name}</b>
                <span className="meta" style={{ display: "block" }}>
                  {person.title}
                </span>
              </div>
              <span className={person.confirmed ? "est ok" : "est"}>
                {person.confirmed ? t("status.confirmed") : t("status.pending")}
              </span>
              {data.canEdit && !person.confirmed ? (
                <>
                  <form action={hv3RespondDeclaredAction}>
                    <input type="hidden" name="experience" value={person.experienceId} />
                    <input type="hidden" name="confirm" value="1" />
                    <button type="submit" className="btn sm pri">
                      {t("confirm")}
                    </button>
                  </form>
                  <form action={hv3RespondDeclaredAction}>
                    <input type="hidden" name="experience" value={person.experienceId} />
                    <input type="hidden" name="confirm" value="0" />
                    <button type="submit" className="btn sm ghost">
                      {t("reject")}
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="meta" style={{ marginTop: 12 }}>
          {t("membersEmpty")}
        </p>
      )}
    </div>
  );
}

/** « Page entreprise » of the recruiter's web app v3 (`V.entreprise` of the prototype). */
export async function HireV3Company({
  tab,
  data,
  query,
}: {
  tab: CompanyTab;
  data: CompanyOverview;
  query: Query;
}) {
  const t = await getTranslations("hireV3Company");
  const tabs = (Object.keys(COMPANY_TABS) as CompanyTab[]).map((key) => ({
    label: t(`tabs.${key}`),
    href: key === "overview" ? PAGE : `${PAGE}?onglet=${COMPANY_TABS[key]}`,
    active: key === tab,
  }));
  return (
    <HirePage view="entreprise">
      <HirePageHead title={t("title")} sub={t("sub", { name: data.org.name })} tabs={tabs} />
      {tab === "edit" ? (
        <Edit data={data} />
      ) : tab === "members" ? (
        <Members data={data} query={query} />
      ) : (
        <Overview data={data} />
      )}
    </HirePage>
  );
}
