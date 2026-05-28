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
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3800,
            className: 'veda-toast',
            style: {
              borderRadius: '18px',
              border: '1px solid var(--card-border)',
              background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)',
              color: 'var(--foreground)',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
              backdropFilter: 'blur(16px)',
              padding: '14px 16px',
              fontWeight: 700,
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#ECFDF5',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FEF2F2',
              },
            },
          }}
        />
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
