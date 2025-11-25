import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleServerless } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// HTTP - reads & simple writes
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzleHttp(sql, { schema });

// Raw SQL access if needed
export { sql };

// Pool - transactions only
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const dbTx = drizzleServerless(pool, { schema });
