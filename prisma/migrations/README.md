# Migration history

## Use `migrate deploy`, not `migrate dev`

```bash
bunx prisma migrate deploy   # applies pending migrations, never resets
```

`prisma migrate dev` compares the folder against the database and offers to
**reset** — dropping every table — whenever it sees a mismatch. On a shared or
production database that is never what you want. Use `migrate dev` only against
a throwaway local database.

## Three migrations here are reconstructions

`20260706000000_add_poke_model`, `20260706000001_enable_realtime_messages_pokes`
and `20260706000002_backfill_accepted_poke_conversations` were recorded as
applied in the database but their folders had been deleted from this repository.
That mismatch is exactly what makes `migrate dev` offer a reset.

They were rebuilt from the live database — columns, indexes, constraints, enum
values and publication membership read straight out of Postgres — and each one
was replayed inside a rolled-back transaction to confirm it runs and produces
the same table. Their `checksum` rows in `_prisma_migrations` were updated to
match the new files; no row was deleted and no data was touched.

What this means in practice:

- **Do not "clean up" these folders.** Deleting them puts the drift back.
- The SQL reproduces today's schema, not necessarily the original byte-for-byte.
  The backfill in particular is a reimplementation of the intent its name
  describes; the original SQL is gone.
- `20260728000002_restore_poke_notification_types` is now redundant on a fresh
  database, because `add_poke_model` declares the same enum values. It is
  idempotent and already applied everywhere, so removing it would only recreate
  the drift it was written to fix.

## The `pokes` table

The table, its rows and the `POKE_*` notification types are still in the
database even though no code sends or answers a poke today. `schema.prisma`
models it deliberately: without the model Prisma treats the table as drift and
generates a migration to drop it.

One thing the schema cannot express is the partial unique index
`pokes_pending_unique` on `(senderId, receiverId) WHERE status = 'PENDING'`.
Prisma has no syntax for partial indexes, so it lives only in the migration SQL.
Prisma leaves it alone rather than dropping it — verified with
`prisma migrate diff`, which reports an empty diff against the live database.

## Checking for drift

Both should be clean before you ship schema changes:

```bash
# History: every migration recorded in the database exists here, and vice versa.
bunx prisma migrate status

# Schema: the database already matches schema.prisma. Exit code 0 means no drift.
bunx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```
