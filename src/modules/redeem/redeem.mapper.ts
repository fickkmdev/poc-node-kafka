import { KafkaTopicConfig } from "../../config";
import { RedeemKafkaMessage, RedeemResponse } from "./redeem.types";

function isRedeemKafkaMessage(data: unknown): data is RedeemKafkaMessage {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate.status === "number" && typeof candidate.message === "string";
}

export function mapRedeemResponse(
  topic: string,
  data: unknown,
  topics: KafkaTopicConfig
): RedeemResponse {
  if (!isRedeemKafkaMessage(data)) {
    return {
      status: 50000,
      description: "fail",
      message: "invalid response format from kafka"
    };
  }

  return {
    status: data.status,
    description: topic === topics.redeemSuccess ? "success" : "fail",
    message: data.message
  };
}
