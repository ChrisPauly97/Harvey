import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "libsql://fridgescanner-leftclick.aws-eu-west-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzExODk2MDIsImlkIjoiNDQyZWU4YjEtNGViYy00YWRkLTk5NmMtZjE5NjY0YmY3YWY5IiwicmlkIjoiYmRiOTZlNDMtZDIwOC00ZDZjLTgxNzktNWMxYWE3NzE2N2M1In0.cVFgHiO0sT008F0t1LlnZC4jqcxrkXlkkpfZ2KYq4QwpfDijmvLkBUw3tW6EogZn3-gYvoVrR7yM-Q-9cDu7DQ",
  },
} satisfies Config;
