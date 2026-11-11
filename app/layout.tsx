import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'EduConecta · Esquenta pro ENEM', description: 'Trilhas, apostilas, simulados e redação para o ENEM, com acompanhamento do professor.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const aplicarTema = `try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: aplicarTema }} />
      </head>
      <body>{children}<div id="toast" role="status" aria-live="polite" /></body>
    </html>
  );
}
