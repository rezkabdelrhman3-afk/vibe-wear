import "dotenv/config";
import { runMaintenance } from "../src/domain/maintenance";
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    const result = await runMaintenance();
    console.log("Maintenance complete:", JSON.stringify(result));
  } catch (error) {
    console.error(
      "Maintenance failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  } finally {
    running = false;
  }
}
void tick();
const interval = setInterval(() => void tick(), 60000);
process.on("SIGTERM", () => {
  clearInterval(interval);
  process.exit(0);
});
