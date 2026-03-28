import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono  = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "Drift", template: "%s · Drift" },
  description: "The identity & authorization mesh for AI agents",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans min-h-screen bg-[#080812] text-white`}>
        <UserProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1A1A2E",
                color: "#fff",
                border: "1px solid rgba(108,71,255,0.2)",
                borderRadius: "12px",
                fontSize: "13px",
              },
              success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
            }}
          />
        </UserProvider>
      </body>
    </html>
  );
}
