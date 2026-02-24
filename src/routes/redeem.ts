import { Request, Response, Router } from "express";
import { Producer } from "kafkajs";
import { randomUUID } from "crypto";
import { config } from "../config";
import { PendingStore } from "../pending";
import { KafkaEnvelope } from "../types/kafka";
import { RedeemErrorResponse, RedeemRequest, RedeemResponse } from "../types/redeem";
import { mapTopicMessageToRedeemResponse } from "../utils/message";

export function createRedeemRouter(
  producer: Producer,
  pending: PendingStore
): Router {
  const router = Router();

  router.post(
    "/redeem",
    async (
      req: Request<Record<string, never>, RedeemResponse | RedeemErrorResponse, RedeemRequest>,
      res: Response<RedeemResponse | RedeemErrorResponse>
    ) => {
    const requestId = randomUUID();

    const payload = {
      requestId,
      body: req.body
    };

    const responsePromise = pending.create(requestId, config.requestTimeoutMs);

    try {
      await producer.send({
        topic: config.topics.request,
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
      res.status(200).json(mapTopicMessageToRedeemResponse(envelope.topic, envelope.data));
    } catch (err) {
      if (err instanceof Error && err.message === "timeout") {
        res.status(504).json({ error: "timeout" });
        return;
      }

      res.status(500).json({ error: "internal_error" });
    }
    }
  );

  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  return router;
}
