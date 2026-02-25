import { Consumer, Kafka, logLevel, Producer } from "kafkajs";
import { AppConfig } from "../../config";
import { extractRequestId, parseMessageValue } from "../../shared/message-utils";
import { KafkaEnvelope } from "../../shared/types";

type MessageHandler = (requestId: string, envelope: KafkaEnvelope) => void;

export class KafkaGateway {
  private readonly producer: Producer;
  private readonly consumer: Consumer;

  constructor(private readonly appConfig: AppConfig) {
    const sasl =
      appConfig.kafka.zone !== "local" &&
      appConfig.kafka.auth.apiKey &&
      appConfig.kafka.auth.apiSecret
        ? {
            mechanism: "plain" as const,
            username: appConfig.kafka.auth.apiKey,
            password: appConfig.kafka.auth.apiSecret
          }
        : undefined;

    const kafka = new Kafka({
      clientId: appConfig.kafka.clientId,
      brokers: appConfig.kafka.brokers,
      connectionTimeout: appConfig.kafka.client.connectionTimeout,
      ssl: appConfig.kafka.client.ssl,
      sasl,
      logLevel: logLevel.NOTHING
    });

    this.producer = kafka.producer();
    this.consumer = kafka.consumer({
      groupId: appConfig.kafka.groupId,
      allowAutoTopicCreation: appConfig.kafka.consumer.allowAutoTopicCreation,
      sessionTimeout: appConfig.kafka.consumer.sessionTimeout
    });
  }

  async connect(responseTopics: string[], onMessage: MessageHandler): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();

    for (const topic of responseTopics) {
      try {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown kafka subscribe error";
        throw new Error(`failed to subscribe topic "${topic}": ${message}`);
      }
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = parseMessageValue(message.value);
        const requestId = extractRequestId(
          message.key,
          message.headers?.requestId,
          data
        );

        if (!requestId) {
          // eslint-disable-next-line no-console
          console.warn(`skip message without request id on topic "${topic}"`);
          return;
        }

        onMessage(requestId, { topic, data });
      }
    });
  }

  async publish(topic: string, requestId: string, body: unknown): Promise<void> {
    const payload = {
      requestId,
      body
    };

    await this.producer.send({
      topic,
      messages: [
        {
          key: requestId,
          value: JSON.stringify(payload),
          headers: {
            requestId
          }
        }
      ]
    });
  }

  async disconnect(): Promise<void> {
    await Promise.allSettled([this.producer.disconnect(), this.consumer.disconnect()]);
  }
}
