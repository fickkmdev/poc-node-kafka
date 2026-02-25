import express, { Request, Response } from "express";
import { AppConfig } from "../config";
import { KafkaGateway } from "../infrastructure/kafka/kafka-gateway";
import { createPointCheckRouter } from "../modules/point-check/point-check.router";
import { createRedeemRouter } from "../modules/redeem/redeem.router";
import { RequestStore } from "../shared/request-store";
import { KafkaEnvelope } from "../shared/types";

export function createApp(
  appConfig: AppConfig,
  gateway: KafkaGateway,
  requestStore: RequestStore<KafkaEnvelope>
) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(createRedeemRouter(appConfig, gateway, requestStore));
  app.use(createPointCheckRouter(appConfig, gateway, requestStore));

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  return app;
}
