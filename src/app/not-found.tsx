import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-primary/10">
          <SearchX className="h-10 w-10 text-primary" />
        </div>
        <p className="text-sm font-semibold text-primary">404 Not Found</p>
        <h1 className="mt-2 text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/launch"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
