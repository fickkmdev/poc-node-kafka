import { randomUUID } from "crypto";
import { Request, Response, Router } from "express";
import { AppConfig } from "../../config";
import { KafkaGateway } from "../../infrastructure/kafka/kafka-gateway";
import { RequestTimeoutError } from "../../shared/errors";
import { RequestStore } from "../../shared/request-store";
import { ApiErrorResponse, KafkaEnvelope } from "../../shared/types";
import { mapPointCheckResponse } from "./point-check.mapper";
import {
  PointCheckFailResponse,
  PointCheckRequest,
  PointCheckSuccessResponse
} from "./point-check.types";

type PointCheckRouteResponse =
  | PointCheckSuccessResponse
  | PointCheckFailResponse
  | ApiErrorResponse;

export function createPointCheckRouter(
  appConfig: AppConfig,
  gateway: KafkaGateway,
  requestStore: RequestStore<KafkaEnvelope>
): Router {
  const router = Router();

  router.post(
    "/point/check",
    async (
      req: Request<Record<string, never>, PointCheckRouteResponse, PointCheckRequest>,
      res: Response<PointCheckRouteResponse>
    ) => {
      const requestId = randomUUID();
      const waitResponse = requestStore.waitFor(requestId, appConfig.server.requestTimeoutMs);

      try {
        await gateway.publish(appConfig.kafka.topics.pointRequest, requestId, req.body);
        const envelope = await waitResponse;
        const response = mapPointCheckResponse(
          envelope.topic,
          envelope.data,
          {
            transactionID: req.body.transactionID,
            msisdn: req.body.msisdn
          },
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
