import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "URL Shortener",
  description: "Transform long URLs into short, shareable links",
};

/**
 * Application root layout that wraps page content with the HTML document shell, global font, and a configured toast container.
 *
 * @param children - The page content to render inside the application's `<body>`
 * @returns A JSX element containing the root `<html>` and `<body>` that render `children` and a top-right `Toaster`
 */
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
