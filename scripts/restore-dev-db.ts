import "dotenv/config";
import { Client } from "pg";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    throw new Error("Restore is restricted to local development PostgreSQL");
  const file = ".local/dev-db.dump";
  if (!existsSync(file)) {
    console.log("No development snapshot. Use migrations and seed.");
    return;
  }
  const client = new Client({ connectionString: url.href });
  await client.connect();
  const { rows } = await client.query(
    "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
  );
  await client.end();
  if (rows[0].count !== 0) {
    console.log("Existing database preserved; restore skipped.");
    return;
  }
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      "-e",
      `PGPASSWORD=${decodeURIComponent(url.password)}`,
      "mashy-postgres",
      "pg_restore",
      "--no-owner",
      "--no-acl",
      "-U",
      decodeURIComponent(url.username),
      "-d",
      url.pathname.slice(1),
    ],
    { input: readFileSync(file), encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error(
      "Development snapshot restoration failed. Inspect database state before retrying.",
    );
  console.log("Development snapshot restored into an empty database.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
