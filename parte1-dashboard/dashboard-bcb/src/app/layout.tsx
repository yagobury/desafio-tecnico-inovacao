import "./globals.css";

export const metadata = {
  title: "Painel Financeiro BCB",
  description: "Dashboard de indicadores do Banco Central do Brasil",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}