export type PointCheckRequest = {
  transactionID: string;
  msisdn: string;
};

export type PointCheckedKafkaMessage = {
  msisdn: string;
  point: number;
  expire: string;
};

export type PointCheckFailKafkaMessage = {
  status: number;
  message: string;
};

export type PointCheckSuccessResponse = {
  transactionID: string;
  msisdn: string;
  point: number;
  expire: string;
};

export type PointCheckFailResponse = {
  status: number;
  message: string;
};
