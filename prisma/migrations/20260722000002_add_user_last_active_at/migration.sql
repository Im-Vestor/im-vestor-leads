-- Presence: `lastSeenAt` records the last heartbeat (tab open), `lastActiveAt`
-- records the last real user interaction. Online = fresh heartbeat + recent
-- interaction; away = fresh heartbeat but idle; offline = no heartbeat.
ALTER TABLE "users" ADD COLUMN "lastActiveAt" TIMESTAMP(3);
