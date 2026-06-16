import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShikshaAI Bharat — Multilingual Classroom Copilot",
  description: "Voice-powered AI tutor for Indian schools — Hindi, Tamil, Telugu, Hinglish & more",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
