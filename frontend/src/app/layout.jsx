import "@/styles/globals.css";

export const metadata = {
  title: "PharmaFlow",
  description: "Simplifying Pharmaceutical Supply Chain Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
