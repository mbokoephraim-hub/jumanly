-- Lot mobile 7 (refonte étape 1): the old talent design is removed. Its theme preference
-- (Clair or Vert) is read by no page any more; the appearance Auto, Clair or Sombre
-- (`appearance`) replaces it. No other user data is touched.
ALTER TABLE "user" DROP COLUMN "theme";
DROP TYPE "UserTheme";
