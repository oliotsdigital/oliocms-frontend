import type { Metadata } from "next";
import "./globals.css";
import { OlioProvider } from "@/state/OlioProvider";

export const metadata: Metadata = {
  title: "OlioCMS - Modern Headless Content Management System",
  description: "Manage your headless store ecosystem with sleek glassmorphism design.",
  icons: {
    icon: "/logos/olioverse_icon.png",
    apple: "/logos/olioverse_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("oliocms_theme_dark");if(s==="true"||(s===null&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="font-sans antialiased text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-950 transition-colors duration-300 min-h-screen selection:bg-brand-500 selection:text-white">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        </div>

        <OlioProvider>{children}</OlioProvider>
      </body>
    </html>
  );
}
