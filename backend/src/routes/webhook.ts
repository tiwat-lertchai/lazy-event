import { Hono } from "hono";
import {
  replyMessage,
  verifySignature,
} from "../shared/providers/line/messaging/client";

const webhookRouter = new Hono();

webhookRouter.post("/", async (c) => {
  const signature = c.req.header("x-line-signature");
  const rawBody = await c.req.text();

  if (!signature || !verifySignature(rawBody, signature)) {
    return c.text("Invalid signature", 401);
  }

  const body = JSON.parse(rawBody);

  for (const event of body.events) {
    if (event.type === "message" && event.message.type === "text") {
      await replyMessage(event.replyToken, [
        { type: "text", text: `คุณพิมพ์ว่า: ${event.message.text}` },
      ]);
    }
  }

  return c.text("OK", 200);
});

export default webhookRouter;
