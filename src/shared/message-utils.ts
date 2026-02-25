export function parseMessageValue(value: Buffer | null): unknown {
  if (!value) return null;

  const text = value.toString("utf-8");

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function extractRequestId(
  messageKey: Buffer | null,
  headerValue: string | Buffer | Array<string | Buffer> | undefined,
  body: unknown
): string | undefined {
  const fromKey = messageKey?.toString();
  if (fromKey) return fromKey;

  const fromHeader =
    typeof headerValue === "string"
      ? headerValue
      : Array.isArray(headerValue)
        ? headerValue[0]?.toString()
        : headerValue?.toString();

  if (fromHeader) return fromHeader;

  if (body && typeof body === "object" && "requestId" in body) {
    return String((body as Record<string, unknown>).requestId);
  }

  return undefined;
}
