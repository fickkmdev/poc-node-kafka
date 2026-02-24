import { Kafka, logLevel, Producer } from "kafkajs";
import { config } from "../config";
import { PendingStore } from "../pending";
import { parseMessageValue } from "../utils/message";

type KafkaClients = {
  producer: Producer;
};

function extractRequestId(
  headerValue: string | Buffer | Array<string | Buffer> | undefined,
  body: unknown
): string | undefined {
  const headerId =
    typeof headerValue === "string"
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0]?.toString()
        : headerValue?.toString();
  if (headerId) return headerId;

  if (body && typeof body === "object" && "requestId" in body) {
    return String((body as Record<string, unknown>).requestId);
  }

  return undefined;
}

export async function initKafka(pending: PendingStore): Promise<KafkaClients> {
  const sasl =
    config.kafka.zone !== "local" && config.kafka.auth.apiKey && config.kafka.auth.apiSecret
      ? {
          mechanism: "plain" as const,
          username: config.kafka.auth.apiKey,
          password: config.kafka.auth.apiSecret
        }
      : undefined;

  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    connectionTimeout: config.kafka.client.connectionTimeout,
    ssl: config.kafka.client.ssl,
    sasl,
    logLevel: logLevel.NOTHING
  });

  const producer = kafka.producer();
  const consumer = kafka.consumer({
    groupId: config.kafka.groupId,
    allowAutoTopicCreation: config.kafka.consumer.allowAutoTopicCreation,
    sessionTimeout: config.kafka.consumer.sessionTimeout
  });

  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: config.topics.success, fromBeginning: false });
  await consumer.subscribe({ topic: config.topics.fail, fromBeginning: false });
  await consumer.subscribe({ topic: config.topics.pointSuccess, fromBeginning: false });
  await consumer.subscribe({ topic: config.topics.pointFail, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const body = parseMessageValue(message.value);
      const requestId = extractRequestId(message.headers?.requestId, body);

      if (!requestId) return;

      pending.resolve(requestId, { topic, data: body });
    }
  });

  return { producer };
}
