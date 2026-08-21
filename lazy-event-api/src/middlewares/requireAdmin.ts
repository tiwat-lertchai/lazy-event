import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { admins } from "../db/schema";

type Variables = {
  lineUserId: string;
};

// Runs after requireUser — expects c.var.lineUserId to already be set.
export const requireAdmin = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const lineUserId = c.var.lineUserId;

    if (!lineUserId) {
      return c.json({ error: "Missing lineUserId, run requireUser first" }, 500);
    }

    // Checking if this LINE userId is registered as an admin
    const admin = await db.query.admins.findFirst({
      where: eq(admins.lineUserId, lineUserId),
    });

    if (!admin) {
      return c.json({ error: "Forbidden, admin only" }, 403);
    }

    await next();
  },
);