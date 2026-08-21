import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/client";
import { photoQueue } from "../db/schema";
import { requireUser } from "../middlewares/requireUser";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  canTransition,
  type QueueStatus,
} from "../domain/photoQueue/stateMachine";
import { sendMessage } from "../shared/providers/line/messaging/client";

const photoRouter = new Hono();

// --- User routes (own queue only) ---

photoRouter.get("/queues", requireUser, async (c) => {
  const lineUserId = c.var.lineUserId;

  const queues = await db
    .select()
    .from(photoQueue)
    .where(eq(photoQueue.lineUserId, lineUserId))
    .orderBy(asc(photoQueue.createdAt));

  return c.json({ queues });
});

photoRouter.get("/queues/:id", requireUser, async (c) => {
  const id = c.req.param("id");
  const lineUserId = c.var.lineUserId;

  const [queue] = await db
    .select()
    .from(photoQueue)
    .where(eq(photoQueue.id, id));

  if (!queue) {
    return c.json({ error: "Queue not found" }, 404);
  }

  // Prevent viewing someone else's queue by guessing the id
  if (queue.lineUserId !== lineUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json({ queue });
});

// --- Admin routes (all queues) ---
// requireUser runs first to resolve lineUserId, then requireAdmin checks the admins table

photoRouter.get("/admin/queues", requireUser, requireAdmin, async (c) => {
  const status = c.req.query("status") as QueueStatus | undefined;

  const queues = await db
    .select()
    .from(photoQueue)
    .where(status ? eq(photoQueue.status, status) : undefined)
    .orderBy(asc(photoQueue.createdAt)); // FIFO order

  return c.json({ queues });
});

photoRouter.patch("/admin/queues/:id", requireUser, requireAdmin, async (c) => {
  const id = c.req.param("id");
  const { status: newStatus } = await c.req.json<{ status: QueueStatus }>();

  const [current] = await db
    .select()
    .from(photoQueue)
    .where(eq(photoQueue.id, id));

  if (!current) {
    return c.json({ error: "Queue not found" }, 404);
  }

  // Checking transition validity before applying
  if (!canTransition(current.status, newStatus)) {
    return c.json(
      { error: `Cannot transition from "${current.status}" to "${newStatus}"` },
      400,
    );
  }

  const [updated] = await db
    .update(photoQueue)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(photoQueue.id, id))
    .returning();

  // Notify user via push message once print job is done
  if (newStatus === "done") {
    await sendMessage(updated.lineUserId, [
      { type: "text", text: "รูปของคุณปริ้นเสร็จแล้ว มารับได้เลย!" },
    ]);
  }

  return c.json({ queue: updated });
});

export default photoRouter;
