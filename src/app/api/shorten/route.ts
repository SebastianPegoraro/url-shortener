import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShortCode, isValidUrl, formatUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const formattedUrl = formatUrl(url);

    if (!isValidUrl(formattedUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check if URL already exists
    const existingUrl = await prisma.url.findFirst({
      where: { originalUrl: formattedUrl },
    });

    if (existingUrl) {
      return NextResponse.json({
        shortCode: existingUrl.shortCode,
        shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${existingUrl.shortCode}`,
        originalUrl: existingUrl.originalUrl,
        clicks: existingUrl.clicks,
        createdAt: existingUrl.createdAt,
      });
    }

    // Generate unique short code
    let shortCode: string;
    let isUnique = false;

    do {
      shortCode = generateShortCode();
      const existing = await prisma.url.findUnique({
        where: { shortCode },
      });
      isUnique = !existing;
    } while (!isUnique);

    const newUrl = await prisma.url.create({
      data: {
        originalUrl: formattedUrl,
        shortCode,
      },
    });

    return NextResponse.json({
      shortCode: newUrl.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${newUrl.shortCode}`,
      originalUrl: newUrl.originalUrl,
      clicks: newUrl.clicks,
      createdAt: newUrl.createdAt,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
