/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Confession` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('LOVE_RELATIONSHIPS', 'FAMILY_FRIENDS', 'WORK_SCHOOL', 'SECRETS_LIES', 'REGRETS_MISTAKES', 'DREAMS_ASPIRATIONS', 'FEARS_ANXIETIES', 'GUILT_SHAME', 'ANGER_FRUSTRATION', 'GRATITUDE_THANKS', 'CONFUSION_DOUBT', 'LONELINESS_ISOLATION', 'SUCCESS_ACHIEVEMENT', 'FAILURE_DISAPPOINTMENT', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."Confession" DROP CONSTRAINT "Confession_categoryId_fkey";

-- AlterTable
ALTER TABLE "Confession" DROP COLUMN "categoryId",
ADD COLUMN     "category" "Category";

-- DropTable
DROP TABLE "public"."Category";
