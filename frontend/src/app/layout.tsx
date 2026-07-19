import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";
import { GoogleProvider } from "@/components/providers/GoogleProvider";
import { AuthHydrate } from "@/components/providers/AuthHydrate";

export const metadata: Metadata = {
  title: "Kodeye",
  description: "Kodeye Frontend Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased scroll-smooth"
    >
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">
        <AuthHydrate />
        <GoogleProvider>
          {children}
          <Toaster />
        </GoogleProvider>
      </body>
    </html>
  );
}
