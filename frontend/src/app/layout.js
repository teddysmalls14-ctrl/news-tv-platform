import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BC News Ent TV",
  description: "Portal de noticias con video, marca de agua y musica libre de derechos",
  openGraph: { title: "BC News Ent TV", description: "Noticias con video y musica libre" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
