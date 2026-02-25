import { randomUUID } from "crypto";
import { Request, Response, Router } from "express";
import { AppConfig } from "../../config";
import { KafkaGateway } from "../../infrastructure/kafka/kafka-gateway";
import { RequestTimeoutError } from "../../shared/errors";
import { RequestStore } from "../../shared/request-store";
import { ApiErrorResponse, KafkaEnvelope } from "../../shared/types";
import { mapRedeemResponse } from "./redeem.mapper";
import { RedeemRequest, RedeemResponse } from "./redeem.types";

type RedeemRouteResponse = RedeemResponse | ApiErrorResponse;

export function createRedeemRouter(
  appConfig: AppConfig,
  gateway: KafkaGateway,
  requestStore: RequestStore<KafkaEnvelope>
): Router {
  const router = Router();

  router.post(
    "/redeem",
    async (
      req: Request<Record<string, never>, RedeemRouteResponse, RedeemRequest>,
      res: Response<RedeemRouteResponse>
    ) => {
      const requestId = randomUUID();
      const waitResponse = requestStore.waitFor(requestId, appConfig.server.requestTimeoutMs);

      try {
        await gateway.publish(appConfig.kafka.topics.redeemRequest, requestId, req.body);
        const envelope = await waitResponse;
        const response = mapRedeemResponse(
          envelope.topic,
          envelope.data,
          appConfig.kafka.topics
        );
        res.status(200).json(response);
      } catch (error) {
        if (error instanceof RequestTimeoutError) {
          res.status(504).json({ error: "timeout" });
          return;
        }

        res.status(500).json({ error: "internal_error" });
      }
    }
  );

  return router;
}
