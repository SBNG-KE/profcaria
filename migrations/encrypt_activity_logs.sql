-- Encrypt Activity Logs Migration
-- We strictly rename the columns.
-- Existing data will become invalid (plaintext inside an enc_ column) but that is acceptable for dev.

-- 1. Professional
ALTER TABLE "professional"."activity_logs" RENAME COLUMN "action" TO "enc_action";
ALTER TABLE "professional"."activity_logs" RENAME COLUMN "ip_address" TO "enc_ip_address";

-- 2. Employer
ALTER TABLE "employer"."activity_logs" RENAME COLUMN "action" TO "enc_action";
ALTER TABLE "employer"."activity_logs" RENAME COLUMN "ip_address" TO "enc_ip_address";
