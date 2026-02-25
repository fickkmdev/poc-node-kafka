import { KafkaTopicConfig } from "../../config";
import {
  PointCheckFailKafkaMessage,
  PointCheckFailResponse,
  PointCheckedKafkaMessage,
  PointCheckSuccessResponse
} from "./point-check.types";

function isPointCheckedKafkaMessage(data: unknown): data is PointCheckedKafkaMessage {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.msisdn === "string" &&
    typeof candidate.point === "number" &&
    typeof candidate.expire === "string"
  );
}

function isPointCheckFailKafkaMessage(data: unknown): data is PointCheckFailKafkaMessage {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Record<string, unknown>;
  return typeof candidate.status === "number" && typeof candidate.message === "string";
}

export function mapPointCheckResponse(
  topic: string,
  data: unknown,
  context: { transactionID: string; msisdn: string },
  topics: KafkaTopicConfig
): PointCheckSuccessResponse | PointCheckFailResponse {
  if (topic === topics.pointSuccess) {
    if (!isPointCheckedKafkaMessage(data)) {
      return { status: 50000, message: "invalid response format from kafka" };
    }

    return {
      transactionID: context.transactionID,
      msisdn: context.msisdn,
      point: data.point,
      expire: data.expire
    };
  }

  if (!isPointCheckFailKafkaMessage(data)) {
    return { status: 50000, message: "invalid response format from kafka" };
  }

  return {
    status: data.status,
    message: data.message
  };
}
