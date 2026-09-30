import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masal LeadOps | Inbound Lead Prioritization Engine",
  description: "AI-powered real estate lead intelligence and prioritization console for high-volume sales reps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased p-2 sm:p-4 lg:p-6">
        <main className="max-w-7xl mx-auto h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
