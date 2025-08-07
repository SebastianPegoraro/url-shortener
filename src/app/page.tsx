import UrlShortener from "@/components/UrlShortener";
import RecentUrls from "@/components/RecentUrls";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="py-12">
        <UrlShortener />
        <div className="mt-12">
          <RecentUrls />
        </div>
      </div>
    </main>
  );
}
