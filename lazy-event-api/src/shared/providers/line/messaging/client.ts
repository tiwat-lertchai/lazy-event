import { createHmac, timingSafeEqual } from "crypto";

const channelSecret = process.env.LINE_CHANNEL_SECRET!;
const accessToken = process.env.LINE_ACCESS_TOKEN!;

export function verifySignature(rawBody: string, signature: string) {
  const hash = createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function sendMessage(to: string, messages: any[]) {
  // Checking Access Token
  if (!accessToken) {
    throw new Error(
      "Access Token Error, Please check at LINE Access Token Config or LINE Access Token isn't found",
    );
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to, messages }),
  });

  if (!res.ok) {
    throw new Error(`LINE push failed: ${res.status} ${await res.text()}`);
  }
}

export async function replyMessage(replyToken: string, messages: any[]) {
  // Checking Access Token
  if (!accessToken) {
    throw new Error(
      "Access Token Error, Please check at LINE Access Token Config or LINE Access Token isn't found",
    );
  }

  // Checking Reply Token
  if (!replyToken) {
    throw new Error(
      "Reply Token Error, Please check at LINE Messaging API Config or Reply Token didn't found",
    );
  }

  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!res.ok) {
    throw new Error(`LINE reply failed: ${res.status} ${await res.text()}`);
  }
}
