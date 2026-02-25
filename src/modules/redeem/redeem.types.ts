export type RedeemRequest = {
  transactionID: string;
  msisdn: string;
  ussd: string;
  point: number;
};

export type RedeemKafkaMessage = {
  status: number;
  message: string;
};

export type RedeemResponse = {
  status: number;
  description: "success" | "fail";
  message: string;
};
