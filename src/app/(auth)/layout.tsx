import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kivicare",
  description: "Sign in to your Kivicare account or create a new Kivicare account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
