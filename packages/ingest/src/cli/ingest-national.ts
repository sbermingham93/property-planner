import { parseArgs } from "node:util";

import { z } from "zod";

import { createDb } from "@property-progress/db";

import { PILOT_COUNCILS, findCouncil } from "../councils.ts";
import type { Council } from "../councils.ts";
import { loadPilotCouncils } from "../load-councils.ts";
import { createLogger } from "../logger.ts";
import { ingestCouncil } from "../national/ingest.ts";

const USAGE = "Usage: ingest-national [--council <slug>]... [--since YYYY-MM-DD]";

const envSchema = z.object({ DATABASE_URL: z.url() });
const argsSchema = z.object({
  council: z.array(z.string()).optional(),
  since: z.iso.date().default("2012-01-01"),
});

const logger = createLogger();

function chosenCouncils(slugs: string[] | undefined): Council[] {
  if (!slugs) return [...PILOT_COUNCILS];
  return slugs.map((slug) => {
    const council = findCouncil(slug);
    if (!council) throw new Error(`Unknown council "${slug}". ${USAGE}`);
    return council;
  });
}

async function main(): Promise<void> {
  const env = envSchema.parse(process.env);
  const { values } = parseArgs({
    options: { council: { type: "string", multiple: true }, since: { type: "string" } },
  });
  const args = argsSchema.parse(values);
  const councils = chosenCouncils(args.council);

  const { db, close } = createDb(env.DATABASE_URL);
  try {
    await loadPilotCouncils(db);
    for (const council of councils) {
      await ingestCouncil(db, council, { receivedFrom: args.since, delayMs: 500 }, logger);
    }
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  logger.error(error, "National ingest failed");
  process.exitCode = 1;
});
