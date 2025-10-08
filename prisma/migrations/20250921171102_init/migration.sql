-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('windows', 'powershell', 'linux', 'mac', 'network');

-- CreateTable
CREATE TABLE "public"."Command" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "commandText" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "copyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Command_pkey" PRIMARY KEY ("id")
);
