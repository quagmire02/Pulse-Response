import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--pr-font-sans",
});

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "PulseResponse — Pharmacy, Equipment and Emergency Response",
    template: "%s | PulseResponse",
  },
  description:
    "Order medicines, buy or rent medical equipment, book a doctor and call an ambulance from one account. PulseResponse dispatches the nearest vehicle and alerts trained volunteers nearby.",
  applicationName: "PulseResponse",
  keywords: [
    "online pharmacy",
    "medical equipment rental",
    "ambulance dispatch",
    "doctor consultation",
    "emergency response",
  ],
  authors: [{ name: "PulseResponse" }],
  openGraph: {
    title: "PulseResponse — Pharmacy, Equipment and Emergency Response",
    description:
      "One account for medicines, medical equipment, doctor consultations and emergency ambulance dispatch.",
    type: "website",
    siteName: "PulseResponse",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b79d4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
