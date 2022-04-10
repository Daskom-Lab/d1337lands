
CREATE TABLE "public"."users" ("id" bigserial NOT NULL, "username" text NOT NULL, "password" text NOT NULL, "role" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("username"));
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_users_updated_at"
BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_users_updated_at" ON "public"."users" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

alter table "public"."users" add column "leetcoin" bigint
 not null default '0';

CREATE TABLE "public"."achievements" ("id" bigserial NOT NULL, "code_id" integer NOT NULL, "user_id" bigint NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));

CREATE TABLE "public"."achievement_codes" ("id" serial NOT NULL, "achievement" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("achievement"));

alter table "public"."achievements"
  add constraint "achievements_code_id_fkey"
  foreign key ("code_id")
  references "public"."achievement_codes"
  ("id") on update restrict on delete restrict;

CREATE TABLE "public"."title_codes" ("id" serial NOT NULL, "title" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("title"));

alter table "public"."achievements" add column "created_at" timestamptz
 not null default now();

alter table "public"."achievements" add column "updated_at" timestamptz
 not null default now();

CREATE TABLE "public"."titles" ("id" bigserial NOT NULL, "code_id" integer NOT NULL, "user_id" bigint NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("code_id") REFERENCES "public"."title_codes"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("code_id"), UNIQUE ("id"));
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_titles_updated_at"
BEFORE UPDATE ON "public"."titles"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_titles_updated_at" ON "public"."titles" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

CREATE TABLE "public"."quests" ("id" bigserial NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "level_id" integer NOT NULL, "category_id" integer NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("title"));

CREATE TABLE "public"."level" ("value" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("value") , UNIQUE ("value"));

alter table "public"."users" add column "character" text
 not null;

CREATE TABLE "public"."category" ("value" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("value") , UNIQUE ("value"));

alter table "public"."users" add column "username_color" Text
 null;

ALTER TABLE "public"."quests" ALTER COLUMN "level_id" TYPE text;
alter table "public"."quests" rename column "level_id" to "level";

ALTER TABLE "public"."quests" ALTER COLUMN "category_id" TYPE text;
alter table "public"."quests" rename column "category_id" to "category";

alter table "public"."quests"
  add constraint "quests_level_fkey"
  foreign key ("level")
  references "public"."level"
  ("value") on update restrict on delete restrict;

alter table "public"."quests"
  add constraint "quests_category_fkey"
  foreign key ("category")
  references "public"."category"
  ("value") on update restrict on delete restrict;

CREATE TABLE "public"."free_hints" ("id" bigserial NOT NULL, "hint" text NOT NULL, "quest_id" bigint NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("quest_id"));

alter table "public"."free_hints"
  add constraint "free_hints_quest_id_fkey"
  foreign key ("quest_id")
  references "public"."quests"
  ("id") on update restrict on delete restrict;

CREATE TABLE "public"."paid_hints" ("id" bigserial NOT NULL, "hint" text NOT NULL, "quest_id" bigint NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"), UNIQUE ("quest_id"));

CREATE TABLE "public"."unlocked_hints" ("id" bigserial NOT NULL, "hint_id" bigint NOT NULL, "user_id" bigint NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("hint_id") REFERENCES "public"."paid_hints"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));

comment on column "public"."users"."username" is E'using user_id from discord';

CREATE TABLE "public"."role" ("value" text NOT NULL, "description" text NOT NULL, PRIMARY KEY ("value") , UNIQUE ("value"));

alter table "public"."users" add column "chosen_title" bigint
 null;

alter table "public"."users"
  add constraint "users_role_fkey"
  foreign key ("role")
  references "public"."role"
  ("value") on update restrict on delete restrict;

alter table "public"."users"
  add constraint "users_chosen_title_fkey"
  foreign key ("chosen_title")
  references "public"."titles"
  ("id") on update restrict on delete restrict;

CREATE TABLE "public"."potions" ("id" bigserial NOT NULL, "code" text NOT NULL, "description" text NOT NULL, "price" bigint NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("code"));

alter table "public"."potions" rename to "potion_codes";

CREATE TABLE "public"."potions" ("id" bigserial NOT NULL, "potion_id" bigint NOT NULL, "user_id" bigint NOT NULL, "is_active" boolean NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("potion_id") REFERENCES "public"."potion_codes"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));

alter table "public"."users" add column "nickname" text
 not null;

comment on column "public"."users"."nickname" is E'using username from discord';

CREATE TABLE "public"."submissions" ("id" bigserial NOT NULL, "answer" text NOT NULL, "is_correct" boolean NOT NULL, "is_redeemed" boolean NOT NULL, "quest_id" bigint NOT NULL, "user_id" bigint NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));
