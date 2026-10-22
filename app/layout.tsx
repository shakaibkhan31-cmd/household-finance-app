import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Household Finance Control Centre",
  description: "Multi-Account SaaS Finance Control Center and Ledger",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-row bg-slate-50 text-slate-800">
        {/* Left Sidebar Navigation */}
        <Sidebar />

        {/* Right Main Content Area */}
        <div className="flex-1 overflow-y-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}