import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import SocketProvider from "../components/SocketProvider";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "VedaAI Assessment Creator",
  description: "Create AI powered assessments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={bricolage.className}>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
