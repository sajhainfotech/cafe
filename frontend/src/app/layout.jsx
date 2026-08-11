import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Cafe — Restaurant Management",
    template: "%s · Cafe",
  },
  description:
    "QR ordering and restaurant management: menus, tables, orders and daily sales.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#236b28",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
