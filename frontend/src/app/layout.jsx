import "@/styles/globals.css";

export const metadata = {
  title: "PulseResponse",
  description: "Pharmaceutical Supply Chain and Emergency Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
