import { createMiddleware } from "hono/factory";

type Variables = {
  lineUserId: string;
};

// Verifies the LIFF access token sent from the frontend and resolves it
// to a LINE userId via LINE's profile endpoint.
export const requireUser = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing access token" }, 401);
    }

    const accessToken = authHeader.slice("Bearer ".length);

    // Checking token validity against LINE, this also gives us the userId
    const res = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return c.json({ error: "Invalid or expired access token" }, 401);
    }

    const profile = (await res.json()) as { userId: string };

    c.set("lineUserId", profile.userId);
    await next();
  },
);
