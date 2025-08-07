import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ shortCode: string }>;
}

export default async function ShortCodePage({ params }: Props) {
  const { shortCode } = await params;

  const url = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (!url) {
    notFound();
  }

  // Increment click count
  prisma.url
    .update({
      where: { id: url.id },
      data: { clicks: { increment: 1 } },
    })
    .catch(console.error);

  redirect(url.originalUrl);
}
