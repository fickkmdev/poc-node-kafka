export type KafkaEnvelope = {
  topic: string;
  data: unknown;
};

export type ApiErrorResponse = {
  error: "timeout" | "internal_error";
};
