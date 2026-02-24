function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
}

export const config = {
  port: Number(process.env.PORT || 3000),
  kafka: {
    brokers: (process.env.BROKERS || process.env.KAFKA_BROKERS || "localhost:9092")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    clientId: process.env.KAFKA_CLIENT_ID || "redeem-gateway",
    groupId: process.env.KAFKA_GROUP_ID || "redeem-gateway-consumer",
    zone: process.env.ZONE || "local",
    client: {
      connectionTimeout: Number(process.env.KAFKA_CONNECTION_TIMEOUT || 10000),
      ssl: parseBoolean(process.env.KAFKA_SSL, false)
    },
    consumer: {
      allowAutoTopicCreation: parseBoolean(
        process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION,
        false
      ),
      sessionTimeout: Number(process.env.KAFKA_SESSION_TIMEOUT || 30000)
    },
    auth: {
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET
    }
  },
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 180000),
  topics: {
    request: "prc.redeemCampaign",
    success: "prc.campaignRedeemed",
    fail: "prc.redeemCampaignFail",
    pointRequest: "prc.checkPoint",
    pointSuccess: "prc.pointChecked",
    pointFail: "prc.chekPointFail"
  }
};
