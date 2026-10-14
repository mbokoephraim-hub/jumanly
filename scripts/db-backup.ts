/**
 * Database backups (partie 10 § 10.5: daily, kept 30 days, restore tested every month).
 *
 *   pnpm db:backup                 dump DATABASE_URL into BACKUP_DIR (default ./backups), with the
 *                                  row counts of the main tables, and delete dumps over 30 days old
 *   pnpm db:restore-check <file>   restore a dump into RESTORE_CHECK_DATABASE_URL (an empty scratch
 *                                  database, never the production one) and compare the row counts
 *
 * Needs the PostgreSQL client tools (pg_dump, pg_restore) of the same major version as the server.
 * The procedure is in docs/exploitation/sauvegardes.md.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const KEEP_DAYS = 30;
const TABLES = [
  "user",
  "TalentProfile",
  "Organization",
  "Job",
  "Application",
  "Course",
  "Subscription",
  "Payment",
  "AuditLog",
] as const;

async function counts(url: string) {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const result: Record<string, number> = {};
    for (const table of TABLES) {
      const { rows } = await client.query<{ n: string }>(`select count(*) as n from "${table}"`);
      result[table] = Number(rows[0]?.n ?? 0);
    }
    return result;
  } finally {
    await client.end();
  }
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} a échoué (code ${result.status}).`);
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variable ${name} manquante.`);
  return value;
}

async function backup() {
  const url = required("DATABASE_URL");
  const dir = process.env.BACKUP_DIR || "backups";
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(dir, `jumanly-${stamp}.dump`);
  // Row counts first: the dump holds at least these rows (writes can only add some meanwhile).
  const before = await counts(url);
  run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${file}`, url]);
  writeFileSync(
    `${file}.json`,
    JSON.stringify({ createdAt: new Date().toISOString(), counts: before }, null, 2),
  );

  const limit = Date.now() - KEEP_DAYS * 86_400_000;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name.startsWith("jumanly-") && statSync(path).mtimeMs < limit) unlinkSync(path);
  }
  console.log(JSON.stringify({ file, counts: before }));
}

async function restoreCheck(file: string | undefined) {
  if (!file)
    throw new Error("Indiquez le fichier à vérifier : pnpm db:restore-check backups/….dump");
  const target = required("RESTORE_CHECK_DATABASE_URL");
  if (target === process.env.DATABASE_URL) {
    throw new Error(
      "RESTORE_CHECK_DATABASE_URL doit être une base de test vide, pas la base principale.",
    );
  }
  const expected = JSON.parse(readFileSync(`${file}.json`, "utf8")).counts as Record<
    string,
    number
  >;
  run("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    `--dbname=${target}`,
    file,
  ]);
  const restored = await counts(target);
  const missing = TABLES.filter((table) => restored[table]! < expected[table]!);
  console.log(JSON.stringify({ file, expected, restored }));
  if (missing.length > 0) {
    throw new Error(`Restauration incomplète : ${missing.join(", ")}.`);
  }
  console.log("✓ Restauration vérifiée : toutes les tables contrôlées sont complètes.");
}

const [command, file] = process.argv.slice(2);
(command === "restore-check" ? restoreCheck(file) : backup()).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
