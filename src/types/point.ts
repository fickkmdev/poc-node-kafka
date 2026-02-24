export type PointCheckRequest = {
  transactionID: string;
  msisdn: string;
};

export type PointCheckedMessage = {
  msisdn: string;
  point: number;
  expire: string;
};

export type PointCheckFailMessage = {
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

export type PointCheckErrorResponse = {
  error: "timeout" | "internal_error";
};
