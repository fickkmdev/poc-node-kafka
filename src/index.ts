import { config } from "./config";
import { createApp } from "./app/create-app";
import { KafkaGateway } from "./infrastructure/kafka/kafka-gateway";
import { RequestStore } from "./shared/request-store";
import { KafkaEnvelope } from "./shared/types";

async function bootstrap() {
  const requestStore = new RequestStore<KafkaEnvelope>();
  const gateway = new KafkaGateway(config);

  await gateway.connect(
    [
      config.kafka.topics.redeemSuccess,
      config.kafka.topics.redeemFail,
      config.kafka.topics.pointSuccess,
      config.kafka.topics.pointFail
    ],
    (requestId, envelope) => {
      requestStore.resolve(requestId, envelope);
    }
  );

  const app = createApp(config, gateway, requestStore);
  const server = app.listen(config.server.port, () => {
    // eslint-disable-next-line no-console
    console.log(`listening on :${config.server.port}`);
  });

  const shutdown = async () => {
    requestStore.rejectAll(new Error("service_shutting_down"));
    server.close();
    await gateway.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("startup error", error);
  process.exit(1);
});
