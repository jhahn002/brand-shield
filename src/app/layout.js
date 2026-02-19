import "./globals.css";

export const metadata = {
  title: "Brand Shield — Protect Your Brand",
  description: "Automated detection, evidence collection, and takedown of brand impersonators in search results.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
