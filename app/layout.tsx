import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "antinet-pwa",
  description: "Full-stack web application — server-rendered or SPA frontend with a backend API, database, authentication, and deployment pipeline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
