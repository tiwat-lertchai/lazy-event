import { Hono } from "hono";
import { defaultIsContentTypeBinary } from "hono/aws-lambda";

const photoRouter = new Hono();

photoRouter.get("/queues", (c) => {
  return c.json({
    msg: "Photo Queues are getting all~",
  });
});

photoRouter.get("/queues/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ q: id });
});

export default photoRouter;
