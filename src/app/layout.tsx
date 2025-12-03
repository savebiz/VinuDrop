import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ThirdwebProviderWrapper from "@/components/providers/ThirdwebProvider";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VinuDrop",
  description: "A physics-based drop game on VinuChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fredoka.variable} ${inter.variable} font-sans antialiased cosmic-theme`}>
        <ThirdwebProviderWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ThirdwebProviderWrapper>
      </body>
    </html>
  );
}
