import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ shortCode: string }>;
}

export default async function ShortCodePage({ params }: Props) {
  const { shortCode } = await params;

  // Use transaction to atomically read and update, preventing race conditions
  const url = await prisma.$transaction(async (tx) => {
    const foundUrl = await tx.url.findUnique({
      where: { shortCode },
    });

    if (!foundUrl) {
      return null;
    }

    // Increment click count atomically within the same transaction
    await tx.url.update({
      where: { id: foundUrl.id },
      data: { clicks: { increment: 1 } },
    });

    return foundUrl;
  });

  if (!url) {
    notFound();
  }

  redirect(url.originalUrl);
}
