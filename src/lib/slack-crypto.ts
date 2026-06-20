import crypto from "crypto";

/**
 * Verifies the signature of an incoming Slack webhook request.
 * 
 * @param signingSecret The Slack Signing Secret for your App.
 * @param rawBody The raw text body of the request.
 * @param timestamp The value of the 'x-slack-request-timestamp' header.
 * @param signature The value of the 'x-slack-signature' header.
 */
export function verifySlackSignature({
  signingSecret,
  rawBody,
  timestamp,
  signature,
}: {
  signingSecret: string;
  rawBody: string;
  timestamp: string;
  signature: string;
}): boolean {
  // Protect against replay attacks by verifying timestamp is recent (within 5 minutes)
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const mySignature = `v0=${crypto
    .createHmac("sha256", signingSecret)
    .update(sigBasestring, "utf8")
    .digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(mySignature, "utf8"), Buffer.from(signature, "utf8"));
}
