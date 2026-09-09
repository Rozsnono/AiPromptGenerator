import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AI Prompt Generator | Powered by Gemini",
  description: "Next-generation AI prompt engineering workflow powered by Google Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: {
                primary: "#22d3ee",
                secondary: "#09090b",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#09090b",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
