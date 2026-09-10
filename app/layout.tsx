import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AI Prompt Generator | Master Prompt Engineering with Gemini",
  description: "Next-generation AI prompt engineering workflow powered by Google Gemini REST API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className="dark">
      <body className="bg-[#090a0f] text-zinc-100 antialiased min-h-screen selection:bg-sky-500/30 selection:text-sky-200">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#12141d",
              color: "#f4f4f6",
              border: "1px solid #27272a",
              borderRadius: "0.85rem",
              fontSize: "0.85rem",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            },
            success: {
              iconTheme: {
                primary: "#38bdf8",
                secondary: "#090a0f",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#090a0f",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
