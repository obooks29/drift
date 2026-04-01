import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { title: "Drift Demo - Travel Booking Agent" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#06060F] text-white antialiased`}>
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { background: "#12122A", color: "#fff", border: "1px solid rgba(108,71,255,0.25)", borderRadius: "12px", fontSize: "13px" } }} />
      </body>
    </html>
  );
}
