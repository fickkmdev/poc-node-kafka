import { config } from "../config";
import {
  PointCheckFailMessage,
  PointCheckFailResponse,
  PointCheckedMessage,
  PointCheckSuccessResponse
} from "../types/point";
import { RedeemKafkaMessage, RedeemResponse } from "../types/redeem";

function isRedeemKafkaMessage(data: unknown): data is RedeemKafkaMessage {
  if (!data || typeof data !== "object") return false;
  const maybe = data as Record<string, unknown>;
  return typeof maybe.status === "number" && typeof maybe.message === "string";
}

export function mapTopicMessageToRedeemResponse(
  topic: string,
  data: unknown
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
    description: topic === config.topics.success ? "success" : "fail",
    message: data.message
  };
}

function isPointCheckedMessage(data: unknown): data is PointCheckedMessage {
  if (!data || typeof data !== "object") return false;
  const maybe = data as Record<string, unknown>;
  return (
    typeof maybe.msisdn === "string" &&
    typeof maybe.point === "number" &&
    typeof maybe.expire === "string"
  );
}

function isPointCheckFailMessage(data: unknown): data is PointCheckFailMessage {
  if (!data || typeof data !== "object") return false;
  const maybe = data as Record<string, unknown>;
  return typeof maybe.status === "number" && typeof maybe.message === "string";
}

export function mapTopicMessageToPointResponse(
  topic: string,
  data: unknown,
  context: { transactionID: string; msisdn: string }
): PointCheckSuccessResponse | PointCheckFailResponse {
  if (topic === config.topics.pointSuccess) {
    if (!isPointCheckedMessage(data)) {
      return { status: 50000, message: "invalid response format from kafka" };
    }

    return {
      transactionID: context.transactionID,
      msisdn: context.msisdn,
      point: data.point,
      expire: data.expire
    };
  }

  if (!isPointCheckFailMessage(data)) {
    return { status: 50000, message: "invalid response format from kafka" };
  }

  return {
    status: data.status,
    message: data.message
  };
}

export function parseMessageValue(value: Buffer | null): unknown {
  if (!value) return null;
  const text = value.toString("utf-8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}
