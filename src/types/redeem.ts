export type RedeemRequest = {
  transactionID: string;
  msisdn: string;
  ussd: string;
  point: number;
};

export type RedeemKafkaMessage = {
  requestId?: string;
  status: number;
  message: string;
};

export type RedeemResponse = {
  status: number;
  description: string;
  message: string;
};

export type RedeemErrorResponse = {
  error: "timeout" | "internal_error";
};
