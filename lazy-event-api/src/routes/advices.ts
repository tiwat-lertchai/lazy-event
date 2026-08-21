import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client";
import { advices } from "../db/schema";
import { requireUser } from "../middlewares/requireUser";
import { requireAdmin } from "../middlewares/requireAdmin";

const adviceRouter = new Hono();

adviceRouter.get("/", async (c) => {
  const messages = await db
    .select()
    .from(advices)
    .orderBy(desc(advices.createdAt));

  return c.json({ messages });
});

adviceRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [message] = await db.select().from(advices).where(eq(advices.id, id));

  if (!message) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json({ message });
});

// Delete requires admin — requireUser resolves lineUserId first, then requireAdmin checks the admins table
adviceRouter.delete("/:id", requireUser, requireAdmin, async (c) => {
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(advices)
    .where(eq(advices.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Message not found" }, 404);
  }

  return c.json({ message: deleted });
});

export default adviceRouter;