import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "FleetFlow AI – Autonomous Fleet Intelligence",
  description: "AI-powered Fleet & Logistics Management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#475569] antialiased font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
