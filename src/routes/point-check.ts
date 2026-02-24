import { randomUUID } from "crypto";
import { Request, Response, Router } from "express";
import { Producer } from "kafkajs";
import { config } from "../config";
import { PendingStore } from "../pending";
import { KafkaEnvelope } from "../types/kafka";
import {
  PointCheckErrorResponse,
  PointCheckFailResponse,
  PointCheckRequest,
  PointCheckSuccessResponse
} from "../types/point";
import { mapTopicMessageToPointResponse } from "../utils/message";

export function createPointCheckRouter(
  producer: Producer,
  pending: PendingStore
): Router {
  const router = Router();

  router.post(
    "/point/ckech",
    async (
      req: Request<
        Record<string, never>,
        PointCheckSuccessResponse | PointCheckFailResponse | PointCheckErrorResponse,
        PointCheckRequest
      >,
      res: Response<PointCheckSuccessResponse | PointCheckFailResponse | PointCheckErrorResponse>
    ) => {
      const requestId = randomUUID();
      const payload = {
        requestId,
        body: req.body
      };
      const responsePromise = pending.create(requestId, config.requestTimeoutMs);

      try {
        await producer.send({
          topic: config.topics.pointRequest,
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

        const responsePayload = await responsePromise;
        const envelope = responsePayload as KafkaEnvelope;
        const mapped = mapTopicMessageToPointResponse(envelope.topic, envelope.data, {
          transactionID: req.body.transactionID,
          msisdn: req.body.msisdn
        });
        res.status(200).json(mapped);
      } catch (err) {
        if (err instanceof Error && err.message === "timeout") {
          res.status(504).json({ error: "timeout" });
          return;
        }

        res.status(500).json({ error: "internal_error" });
      }
    }
  );

  return router;
}
