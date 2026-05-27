import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import SocketProvider from "../components/SocketProvider";
import { Toaster } from "react-hot-toast";

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
        <Toaster position="top-center" />
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
