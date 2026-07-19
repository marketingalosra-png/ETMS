"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring in production
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white">
          <motion.div
            className="max-w-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-red-500/15">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-slate-400">
              An unexpected error occurred. Our team has been notified.
              {error.digest && (
                <span className="block mt-1 font-mono text-xs text-slate-500">
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset} variant="secondary">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Link href="/launch">
                <Button>
                  <Home className="h-4 w-4" />
                  Return to dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
