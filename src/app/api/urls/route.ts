import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get the type from Prisma instance
type Url = NonNullable<Awaited<ReturnType<typeof prisma.url.findFirst>>>;

export async function GET() {
  try {
    const urls = await prisma.url.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedUrls = urls.map((url: Url) => ({
      ...url,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${url.shortCode}`,
    }));

    return NextResponse.json(formattedUrls);
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
