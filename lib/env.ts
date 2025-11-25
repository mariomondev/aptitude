import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.url({
    error: "DATABASE_URL is required",
  }),

  // Better Auth
  BETTER_AUTH_URL: z.url({
    error: "BETTER_AUTH_URL is required",
  }),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.url({
    error: "NEXT_PUBLIC_BETTER_AUTH_URL is required",
  }),

  // Social providers
  GOOGLE_CLIENT_ID: z.string({
    error: "GOOGLE_CLIENT_ID is required",
  }),
  GOOGLE_CLIENT_SECRET: z.string({
    error: "GOOGLE_CLIENT_SECRET is required",
  }),
});

// Validate environment variables
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    result.error.issues.map((issue) => {
      console.error(`${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

// Export validated environment variables
export const env = validateEnv();
