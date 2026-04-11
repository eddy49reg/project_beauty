-- Приведение старых записей без «+» к E.164 (типичный ввод из РФ).
UPDATE "users"
SET "phone" = '+7' || SUBSTRING("phone" FROM 2)
WHERE LENGTH("phone") = 11 AND "phone" ~ '^8[0-9]{10}$' AND "phone" NOT LIKE '+%';

UPDATE "users"
SET "phone" = '+' || "phone"
WHERE LENGTH("phone") = 11 AND "phone" ~ '^7[0-9]{10}$' AND "phone" NOT LIKE '+%';
