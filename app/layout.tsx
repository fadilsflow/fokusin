import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { QueryProvider } from "@/components/providers";
import { createOrUpdateProfile } from "./actions/profile";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Jeda",
  description: "A pomodoro timer to help you focus and get things done.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

async function ProfileInitializer() {
  await createOrUpdateProfile();
  return null;
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${fredoka.variable} antialiased`}>
          <QueryProvider>
            <ProfileInitializer />
            <main className="dark bg-background text-foreground ">
              {children}
            </main>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
