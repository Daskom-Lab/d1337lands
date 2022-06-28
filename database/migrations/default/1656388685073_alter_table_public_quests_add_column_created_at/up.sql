alter table "public"."quests" add column "created_at" timestamptz
 null default now();
