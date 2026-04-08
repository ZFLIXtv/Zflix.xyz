-- AlterTable: make referralCode nullable (only users who have paid get one)
ALTER TABLE "User" ALTER COLUMN "referralCode" DROP NOT NULL;
