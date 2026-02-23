import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Job Search Tracker",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
