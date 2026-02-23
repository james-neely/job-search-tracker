import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Job Search Tracker",
  description: "Track your job applications, stats, and interview prep",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-icon-180.png",
  },
  appleWebApp: {
    capable: true,
    title: "Job Tracker",
    statusBarStyle: "default",
  },
  themeColor: "#1976d2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
