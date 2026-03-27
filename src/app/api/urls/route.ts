import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get the type from Prisma instance
type Url = NonNullable<Awaited<ReturnType<typeof prisma.url.findFirst>>>;

/**
 * Fetches the 10 most recently created URL records and returns them with a fully-qualified `shortUrl` property added to each record.
 *
 * @returns A JSON response containing an array of URL records where each record includes an added `shortUrl` field set to `${process.env.NEXT_PUBLIC_BASE_URL}/${shortCode}`; on failure, a JSON error object `{ error: "Internal server error" }` is returned with HTTP status 500.
 */
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
      { status: 500 },
    );
  }
}
