import express from "express";
import { Producer } from "kafkajs";
import { PendingStore } from "./pending";
import { createPointCheckRouter } from "./routes/point-check";
import { createRedeemRouter } from "./routes/redeem";

export function createServer(producer: Producer, pending: PendingStore) {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(createRedeemRouter(producer, pending));
  app.use(createPointCheckRouter(producer, pending));

  return app;
}
