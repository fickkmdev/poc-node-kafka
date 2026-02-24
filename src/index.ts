import { config } from "./config";
import { initKafka } from "./kafka";
import { createPendingStore } from "./pending";
import { createServer } from "./server";

async function main() {
  const pending = createPendingStore();
  const { producer } = await initKafka(pending);

  const app = createServer(producer, pending);

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`listening on :${config.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("startup error", err);
  process.exit(1);
});
