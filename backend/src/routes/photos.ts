import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/client";
import { photos, printJobs } from "../db/schema";
import { requireUser } from "../middlewares/requireUser";
import { requireAdmin } from "../middlewares/requireAdmin";
import { canTransition, type QueueStatus } from "../domain/photoQueue/stateMachine";
import { getPriceForQuantity, ALLOWED_QUANTITIES } from "../domain/pricing/tiers";
import { sendMessage } from "../shared/providers/line/messaging/client";
import { uploadPhoto, InvalidUploadError } from "../shared/storage/local";

type PaperSize = "4x6" | "polaroid_3x3";
const VALID_PAPER_SIZES: PaperSize[] = ["4x6", "polaroid_3x3"];

interface UploadItem {
  paperSize: PaperSize;
  quantity: number;
}

const photoRouter = new Hono();

// --- Upload (creates a photo + one print job per requested paperSize+quantity item) ---

photoRouter.post("/photos", requireUser, async (c) => {
  const lineUserId = c.var.lineUserId;
  const body = await c.req.parseBody({ all: true });

  // "file" can be a single File or an array of Files depending on how many were selected
  const rawFiles = body["file"];
  const files = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
  const validFiles = files.filter((f): f is File => f instanceof File);

  if (validFiles.length === 0) {
    return c.json({ error: "Missing file" }, 400);
  }

  // "items" arrives as a JSON string, e.g. '[{"paperSize":"4x6","quantity":6}]'
  // Same items apply to every file in this batch, keeps the upload form simple.
  const rawItems = body["items"];
  if (typeof rawItems !== "string") {
    return c.json({ error: "Missing items" }, 400);
  }

  let parsedItems: UploadItem[];
  try {
    parsedItems = JSON.parse(rawItems);
  } catch {
    return c.json({ error: "Items Error, items must be valid JSON" }, 400);
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    return c.json({ error: "At least one print item is required" }, 400);
  }

  // Checking every item has a valid paperSize and an allowed quantity tier
  for (const item of parsedItems) {
    if (!VALID_PAPER_SIZES.includes(item.paperSize)) {
      return c.json({ error: `Invalid paperSize: ${item.paperSize}` }, 400);
    }
    if (!ALLOWED_QUANTITIES.includes(item.quantity)) {
      return c.json(
        { error: `Invalid quantity: ${item.quantity}, allowed: ${ALLOWED_QUANTITIES.join(", ")}` },
        400,
      );
    }
  }

  // Upload every file first, fail the whole request if any single one is invalid
  // rather than leaving a half-created batch in the database.
  let imageUrls: string[];
  try {
    imageUrls = await Promise.all(validFiles.map((file) => uploadPhoto(file, lineUserId)));
  } catch (err) {
    if (err instanceof InvalidUploadError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }

  // One photo + one set of print jobs per file, all sharing the same items
  const results = [];
  for (const imageUrl of imageUrls) {
    const [photo] = await db
      .insert(photos)
      .values({ lineUserId, imageUrl })
      .returning();

    // Price is looked up server-side, never trust a price from the client
    const jobs = await db
      .insert(printJobs)
      .values(
        parsedItems.map((item) => ({
          photoId: photo.id,
          lineUserId,
          paperSize: item.paperSize,
          quantity: item.quantity,
          priceBaht: getPriceForQuantity(item.quantity)!, // Already validated above
        })),
      )
      .returning();

    results.push({ photo, jobs });
  }

  return c.json({ results }, 201);
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
      quantity: printJobs.quantity,
      priceBaht: printJobs.priceBaht,
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
      quantity: printJobs.quantity,
      priceBaht: printJobs.priceBaht,
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
      quantity: printJobs.quantity,
      priceBaht: printJobs.priceBaht,
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