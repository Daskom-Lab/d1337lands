
DROP TABLE "public"."submissions";

comment on column "public"."users"."nickname" is NULL;

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."users" add column "nickname" text
--  not null;

DROP TABLE "public"."potions";

alter table "public"."potion_codes" rename to "potions";

DROP TABLE "public"."potions";

alter table "public"."users" drop constraint "users_chosen_title_fkey";

alter table "public"."users" drop constraint "users_role_fkey";

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."users" add column "chosen_title" bigint
--  null;

DROP TABLE "public"."role";

comment on column "public"."users"."username" is NULL;

DROP TABLE "public"."unlocked_hints";

DROP TABLE "public"."paid_hints";

alter table "public"."free_hints" drop constraint "free_hints_quest_id_fkey";

DROP TABLE "public"."free_hints";

alter table "public"."quests" drop constraint "quests_category_fkey";

alter table "public"."quests" drop constraint "quests_level_fkey";

alter table "public"."quests" rename column "category" to "category_id";
ALTER TABLE "public"."quests" ALTER COLUMN "category_id" TYPE integer;

alter table "public"."quests" rename column "level" to "level_id";
ALTER TABLE "public"."quests" ALTER COLUMN "level_id" TYPE integer;

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."users" add column "username_color" Text
--  null;

DROP TABLE "public"."category";

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."users" add column "character" text
--  not null;

DROP TABLE "public"."level";

DROP TABLE "public"."quests";

DROP TABLE "public"."titles";

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."achievements" add column "updated_at" timestamptz
--  not null default now();

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."achievements" add column "created_at" timestamptz
--  not null default now();

DROP TABLE "public"."title_codes";

alter table "public"."achievements" drop constraint "achievements_code_id_fkey";

DROP TABLE "public"."achievement_codes";

DROP TABLE "public"."achievements";

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."users" add column "leetcoin" bigint
--  not null default '0';

DROP TABLE "public"."users";
