import { Hono } from "hono";
import { logger } from "hono/logger";
import adviceRouter from "./routes/advices";
import photoRouter from "./routes/photos";

// Applications Router Files
const app = new Hono();

// Application Extenstions
app.use(logger());

// Application Routers
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/advices", adviceRouter);
app.route("/photos", photoRouter);

export default app;
