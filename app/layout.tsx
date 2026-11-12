import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestion du portfolio — Photos et tâches",
  description: "Gérer les photos et les descriptions de tâches des projets du portfolio.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
