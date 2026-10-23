import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "AI Prompt Generator | Master Prompt Engineering with Claude",
  description: "Next-generation AI prompt engineering workflow powered by the Anthropic Claude API",
};

/** Mentett téma (vagy a rendszerbeállítás) alkalmazása az első festés előtt. */
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("ai_prompt_gen_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className="dark" suppressHydrationWarning>
      <head>
        {/* Téma beállítása renderelés előtt, hogy ne villanjon */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-zinc-100 antialiased min-h-screen selection:bg-sky-500/30 selection:text-sky-200">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--toast-bg)",
              color: "var(--foreground)",
              border: "1px solid var(--toast-border)",
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
