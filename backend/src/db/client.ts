import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL Error, Please check at Neon Config or DATABASE_URL isn't found",
  );
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });