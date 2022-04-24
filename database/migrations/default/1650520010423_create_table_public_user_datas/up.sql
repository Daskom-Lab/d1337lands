CREATE TABLE "public"."user_datas" ("id" bigserial NOT NULL, "user_id" bigint NOT NULL, "position" text NOT NULL, "map" text NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"), UNIQUE ("user_id"));
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
CREATE TRIGGER "set_public_user_datas_updated_at"
BEFORE UPDATE ON "public"."user_datas"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_user_datas_updated_at" ON "public"."user_datas" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
