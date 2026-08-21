import { Hono } from "hono";
import { eq, and, asc, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { photos, printJobs } from "../db/schema";
import { requireUser } from "../middlewares/requireUser";
import { requireAdmin } from "../middlewares/requireAdmin";
import { canTransition, type QueueStatus } from "../domain/photoQueue/stateMachine";
import { sendMessage } from "../shared/providers/line/messaging/client";
import { uploadPhoto, InvalidUploadError } from "../shared/storage/local";

type PaperSize = "4x6" | "polaroid_3x3";
const VALID_PAPER_SIZES: PaperSize[] = ["4x6", "polaroid_3x3"];

const photoRouter = new Hono();

// --- Upload (creates a photo + one print job per requested paper size) ---

photoRouter.post("/photos", requireUser, async (c) => {
  const lineUserId = c.var.lineUserId;
  const body = await c.req.parseBody({ all: true });

  const file = body["file"];
  if (!(file instanceof File)) {
    return c.json({ error: "Missing file" }, 400);
  }

  // paperSizes can arrive as a single value or multiple, e.g. "4x6" or ["4x6","polaroid_3x3"]
  const rawSizes = body["paperSizes"];
  const paperSizes = (Array.isArray(rawSizes) ? rawSizes : [rawSizes]).filter(
    (s): s is PaperSize => typeof s === "string" && VALID_PAPER_SIZES.includes(s as PaperSize),
  );

  if (paperSizes.length === 0) {
    return c.json({ error: "At least one valid paperSize is required (4x6, polaroid_3x3)" }, 400);
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadPhoto(file, lineUserId);
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }

  const [photo] = await db
    .insert(photos)
    .values({ lineUserId, imageUrl })
    .returning();

  // One print job per requested size, dedup in case of duplicates in the request
  const uniqueSizes = [...new Set(paperSizes)];
  const jobs = await db
    .insert(printJobs)
    .values(
      uniqueSizes.map((paperSize) => ({
        photoId: photo.id,
        lineUserId,
        paperSize,
      })),
    )
    .returning();

  return c.json({ photo, jobs }, 201);
});

// --- User routes (own queue only) ---

photoRouter.get("/queues", requireUser, async (c) => {
  const lineUserId = c.var.lineUserId;

  const jobs = await db
    .select({
      id: printJobs.id,
      photoId: printJobs.photoId,
      imageUrl: photos.imageUrl,
      paperSize: printJobs.paperSize,
      status: printJobs.status,
      createdAt: printJobs.createdAt,
      updatedAt: printJobs.updatedAt,
    })
    .from(printJobs)
    .innerJoin(photos, eq(printJobs.photoId, photos.id))
    .where(eq(printJobs.lineUserId, lineUserId))
    .orderBy(asc(printJobs.createdAt));

  return c.json({ jobs });
});

photoRouter.get("/queues/:id", requireUser, async (c) => {
  const id = c.req.param("id");
  const lineUserId = c.var.lineUserId;

  const [job] = await db
    .select({
      id: printJobs.id,
      photoId: printJobs.photoId,
      imageUrl: photos.imageUrl,
      paperSize: printJobs.paperSize,
      status: printJobs.status,
      lineUserId: printJobs.lineUserId,
      createdAt: printJobs.createdAt,
      updatedAt: printJobs.updatedAt,
    })
    .from(printJobs)
    .innerJoin(photos, eq(printJobs.photoId, photos.id))
    .where(eq(printJobs.id, id));

  if (!job) {
    return c.json({ error: "Print job not found" }, 404);
  }

  // Prevent viewing someone else's job by guessing the id
  if (job.lineUserId !== lineUserId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json({ job });
});

// --- Admin routes (all print jobs) ---
// requireUser runs first to resolve lineUserId, then requireAdmin checks the admins table

photoRouter.get("/admin/queues", requireUser, requireAdmin, async (c) => {
  const status = c.req.query("status") as QueueStatus | undefined;

  const jobs = await db
    .select({
      id: printJobs.id,
      photoId: printJobs.photoId,
      imageUrl: photos.imageUrl,
      paperSize: printJobs.paperSize,
      status: printJobs.status,
      lineUserId: printJobs.lineUserId,
      createdAt: printJobs.createdAt,
      updatedAt: printJobs.updatedAt,
    })
    .from(printJobs)
    .innerJoin(photos, eq(printJobs.photoId, photos.id))
    .where(status ? eq(printJobs.status, status) : undefined)
    .orderBy(asc(printJobs.createdAt)); // FIFO order

  return c.json({ jobs });
});

photoRouter.patch("/admin/queues/:id", requireUser, requireAdmin, async (c) => {
  const id = c.req.param("id");
  const { status: newStatus } = await c.req.json<{ status: QueueStatus }>();

  const [current] = await db
    .select()
    .from(printJobs)
    .where(eq(printJobs.id, id));

  if (!current) {
    return c.json({ error: "Print job not found" }, 404);
  }

  // Checking transition validity before applying
  if (!canTransition(current.status, newStatus)) {
    return c.json(
      { error: `Cannot transition from "${current.status}" to "${newStatus}"` },
      400,
    );
  }

  const [updated] = await db
    .update(printJobs)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(printJobs.id, id))
    .returning();

  // Notify user via push message once print job is done
  if (newStatus === "done") {
    await sendMessage(updated.lineUserId, [
      { type: "text", text: "รูปของคุณปริ้นเสร็จแล้ว มารับได้เลย!" },
    ]);
  }

  return c.json({ job: updated });
});

export default photoRouter;