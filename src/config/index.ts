import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export type KafkaTopicConfig = {
  redeemRequest: string;
  redeemSuccess: string;
  redeemFail: string;
  pointRequest: string;
  pointSuccess: string;
  pointFail: string;
};

export type AppConfig = {
  server: {
    port: number;
    requestTimeoutMs: number;
  };
  kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
    zone: string;
    client: {
      connectionTimeout: number;
      ssl: boolean;
    };
    consumer: {
      allowAutoTopicCreation: boolean;
      sessionTimeout: number;
    };
    auth: {
      apiKey?: string;
      apiSecret?: string;
    };
    topics: KafkaTopicConfig;
  };
};

function loadDotEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnvFile(resolve(process.cwd(), ".env"));

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

function parseBrokers(): string[] {
  const raw = process.env.BROKERS || process.env.KAFKA_BROKERS || "localhost:9092";
  return raw
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);
}

export const config: AppConfig = {
  server: {
    port: parseNumber(process.env.PORT, 3000),
    requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 180000)
  },
  kafka: {
    brokers: parseBrokers(),
    clientId: process.env.KAFKA_CLIENT_ID || "redeem-gateway",
    groupId: process.env.KAFKA_GROUP_ID || "redeem-gateway-consumer",
    zone: process.env.ZONE || "local",
    client: {
      connectionTimeout: parseNumber(process.env.KAFKA_CONNECTION_TIMEOUT, 10000),
      ssl: parseBoolean(process.env.KAFKA_SSL, false)
    },
    consumer: {
      allowAutoTopicCreation: parseBoolean(
        process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION,
        false
      ),
      sessionTimeout: parseNumber(process.env.KAFKA_SESSION_TIMEOUT, 30000)
    },
    auth: {
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET
    },
    topics: {
      redeemRequest: process.env.TOPIC_REDEEM_REQUEST || "prc.redeemCampaign",
      redeemSuccess: process.env.TOPIC_REDEEM_SUCCESS || "prc.campaignRedeemed",
      redeemFail: process.env.TOPIC_REDEEM_FAIL || "prc.redeemCampaignFail",
      pointRequest: process.env.TOPIC_POINT_REQUEST || "prc.checkPoint",
      pointSuccess: process.env.TOPIC_POINT_SUCCESS || "prc.pointChecked",
      pointFail: process.env.TOPIC_POINT_FAIL || "prc.checkPointFail"
    }
  }
};
