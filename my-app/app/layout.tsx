import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import "ol/ol.css";
import { Toaster } from "@/components/ui/sonner";
import ClientProviders from "@/components/ClientProviders";
import ConfirmDialogProvider from "@/components/ConfirmDialogProvider";
import ConditionalSupportChatbot from "@/components/ConditionalSupportChatbot";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MobiliAI",
  description: "Sistema de Gestão",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster />
        <ConfirmDialogProvider />
        <ConditionalSupportChatbot />
      </body>
    </html>
  );
}