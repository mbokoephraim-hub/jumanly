import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, Select, TextField } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { setUserRole, setUserStatus } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";

const PAGE_SIZE = 50;
const roles = ["user", "content_editor", "support_agent", "platform_admin"] as const;

/** Users: search, status, platform role. Private messages and documents are never shown here. */
export default async function AdminUsers({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  const t = await getTranslations("admin");
  const writable = admin ? canWriteAdmin(admin) : false;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const back = q ? `/admin/utilisateurs?q=${encodeURIComponent(q)}` : "/admin/utilisateurs";
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { id: q },
        ],
      }
    : {};
  const [count, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE_SIZE }),
  ]);
  const plans = await Promise.all(
    users.map((user) => resolvePlan(db, { type: "user", id: user.id })),
  );

  return (
    <>
      <h1 className="text-h1">{t("users.title")}</h1>
      {params.ok && <Alert tone="success" title={t("users.updated")} />}
      {params.erreur === "soi" && <Alert tone="error" title={t("users.selfProtected")} />}
      {params.erreur === "motif" && <Alert tone="error" title={t("reason.required")} />}
      <form role="search" className="flex flex-wrap items-end gap-3">
        <TextField
          id="q"
          name="q"
          type="search"
          label={t("users.search.placeholder")}
          defaultValue={q}
          className="min-w-64"
        />
        <Button type="submit" variant="secondary">
          {t("users.search.submit")}
        </Button>
      </form>
      <p className="text-sm text-ardoise">{t("users.count", { count })}</p>
      {users.length === 0 ? (
        <p>{t("users.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user, index) => {
            const status =
              user.status === "suspended"
                ? "suspended"
                : user.deletionScheduledAt
                  ? "deletionScheduled"
                  : user.emailVerified
                    ? "active"
                    : "unverified";
            return (
              <li key={user.id} className="flex flex-col gap-3 rounded-card bg-blanc p-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-sm">{user.email}</span>
                  <Badge
                    tone={
                      status === "active" ? "success" : status === "suspended" ? "error" : "warning"
                    }
                  >
                    {t(`users.status.${status}`)}
                  </Badge>
                  {user.platformRole !== "user" && (
                    <Badge tone="sapin">{t(`role.${user.platformRole}`)}</Badge>
                  )}
                </div>
                <p className="text-sm text-ardoise">
                  {t("users.summary", {
                    plan: plans[index]?.planName ?? "",
                    date: formatDate(user.createdAt),
                  })}
                </p>
                {writable && user.id !== admin?.id && (
                  <details>
                    <summary className="cursor-pointer text-sm font-medium underline">
                      {t("users.detail.title")}
                    </summary>
                    <div className="mt-3 flex flex-col gap-4 rounded-md bg-creme p-4">
                      <form action={setUserStatus} className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="back" value={back} />
                        {user.status === "suspended" ? (
                          <>
                            <input type="hidden" name="status" value="active" />
                            <Button type="submit" variant="secondary" size="sm">
                              {t("users.action.unsuspend")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <input type="hidden" name="status" value="suspended" />
                            <TextField
                              id={`reason-${user.id}`}
                              name="reason"
                              label={t("users.action.suspend.reason")}
                              required
                              className="min-w-64"
                            />
                            <Button type="submit" variant="danger" size="sm">
                              {t("users.action.suspend.text")}
                            </Button>
                          </>
                        )}
                      </form>
                      <form action={setUserRole} className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="back" value={back} />
                        <Select
                          id={`role-${user.id}`}
                          name="role"
                          label={t("users.action.roles.text")}
                          hint={t("users.action.roles.warning")}
                          defaultValue={user.platformRole}
                          options={roles.map((role) => ({
                            value: role,
                            label: role === "user" ? t("users.role.user") : t(`role.${role}`),
                          }))}
                        />
                        <Button type="submit" variant="secondary" size="sm">
                          {t("users.action.roles.save")}
                        </Button>
                      </form>
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
