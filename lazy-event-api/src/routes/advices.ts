import { Hono } from "hono";

const adviceRouter = new Hono();

adviceRouter.get("/", (c) => {
  return c.json({
    msg: "Hello, All Advices Comments",
  });
});

adviceRouter.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ msg: id });
});

export default adviceRouter;
