import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "ScreenIQ — AI Candidate Screener",
  description: "Privacy-first, in-browser AI screening",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("auth")?.value === "authenticated";

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", background: "var(--surface)" }}>
        <nav style={{
          background: "var(--primary)", padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px",
        }}>
          <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>ScreenIQ</span>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {isLoggedIn && (
              <>
                <a href="/screen" style={{ color: "#7887ab", fontSize: "14px", textDecoration: "none" }}>Screen</a>
                <a href="/dashboard" style={{ color: "#7887ab", fontSize: "14px", textDecoration: "none" }}>Dashboard</a>
                <LogoutButton />
              </>
            )}
          </div>
        </nav>
        <main style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 32px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}