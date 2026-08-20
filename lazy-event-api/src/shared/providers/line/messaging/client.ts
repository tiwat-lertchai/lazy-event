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

export async function replyMessage(replyToken: string, message: any[]) {
  // Checking Reply Token
  if (!replyToken) {
    throw new Error(
      "Reply Token Error, Please check at LINE Messaging API Config or Reply Token didn't found",
    );
  }
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken }),
  });
}
