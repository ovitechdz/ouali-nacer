import { z } from 'zod';

/** Version of the persisted farm document. Bumped by the migration registry. */
export const FARM_SCHEMA_VERSION = 1;

export const farmDocumentSchema = z.object({
  schemaVersion: z.literal(FARM_SCHEMA_VERSION),
  updatedAt: z.iso.datetime(),
});

export type FarmDocument = z.infer<typeof farmDocumentSchema>;
