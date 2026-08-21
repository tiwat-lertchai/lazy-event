import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import adviceRouter from "./routes/advices";
import photoRouter from "./routes/photos";

// Applications Router Files
const app = new Hono();

// Application Extenstions
app.use(logger());

// Allow requests from the frontend origin only, not "*"
// since routes send an Authorization bearer token
app.use(
  "*",
  cors({
    origin: (process.env.CORS_ORIGIN ?? "").split(",").filter(Boolean),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Serve uploaded photo files from disk (matches UPLOAD_PUBLIC_URL base path)
app.use("/uploads/*", serveStatic({ root: "./" }));

// Application Routers
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/advices", adviceRouter);
app.route("/photos", photoRouter);

export default app;