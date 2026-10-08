import "dotenv/config";
import { spawnSync } from "node:child_process";
const url = new URL(process.env.DATABASE_URL || "");
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("db:up only manages a local development database");
const name = "mashy-postgres";
const inspect = spawnSync(
  "docker",
  ["inspect", "--format", "{{.State.Running}}", name],
  { encoding: "utf8" },
);
if (inspect.status === 0) {
  if (inspect.stdout.trim() !== "true") {
    const result = spawnSync("docker", ["start", name], { stdio: "inherit" });
    if (result.status) process.exit(result.status);
  }
  console.log("Local PostgreSQL is running.");
} else {
  if (!url.password)
    throw new Error(
      "Set a local PostgreSQL password in DATABASE_URL before creating a new container",
    );
  const result = spawnSync(
    "docker",
    [
      "run",
      "-d",
      "--name",
      name,
      "-e",
      `POSTGRES_USER=${decodeURIComponent(url.username)}`,
      "-e",
      `POSTGRES_PASSWORD=${decodeURIComponent(url.password)}`,
      "-e",
      `POSTGRES_DB=${url.pathname.slice(1)}`,
      "-p",
      `127.0.0.1:${url.port || 5432}:5432`,
      "-v",
      "mashy-pgdata:/var/lib/postgresql/data",
      "postgres:17-alpine",
    ],
    { stdio: "inherit" },
  );
  if (result.status) process.exit(result.status);
}
