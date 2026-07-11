import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "ETMS | Employee Training Management System",
  description: "Premium enterprise training operations, compliance, and workforce learning platform."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
