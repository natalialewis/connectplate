import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header/Header";
import { ProfileProvider } from "@/lib/contexts/ProfileContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConnectPlate",
  description: "ConnectPlate web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Initialize dark/light theme from localStorage or system preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=t||(d?"dark":"light");document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(r);})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased bg-background text-foreground`}
      >
        <ProfileProvider>
          <Header />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </ProfileProvider>
      </body>
    </html>
  );
}
