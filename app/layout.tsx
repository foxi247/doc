import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://mednavigatorai.com"),
  title: {
    default: "MedNavigator AI — AI Medical Navigation Before the Doctor Visit",
    template: "%s | MedNavigator AI",
  },
  description:
    "AI medical agents help you organize symptoms, upload ECG/MRI/lab results, assess urgency, and prepare a doctor-ready summary — without diagnosis or treatment.",
  keywords: [
    "medical navigation",
    "AI health",
    "symptom organizer",
    "specialist routing",
    "doctor preparation",
    "medical summary",
    "health tech",
  ],
  authors: [{ name: "MedNavigator AI" }],
  creator: "MedNavigator AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mednavigatorai.com",
    siteName: "MedNavigator AI",
    title: "MedNavigator AI — AI Medical Navigation Before the Doctor Visit",
    description:
      "AI medical agents help you organize symptoms, upload ECG/MRI/lab results, assess urgency, and prepare a doctor-ready summary.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MedNavigator AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MedNavigator AI — AI Medical Navigation Before the Doctor Visit",
    description:
      "AI medical agents help you organize symptoms, upload ECG/MRI/lab results, assess urgency, and prepare a doctor-ready summary.",
    images: ["/og-image.png"],
    creator: "@mednavigatorai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
