import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getBaseUrl } from "@/lib/utils";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light"
};

export const metadata: Metadata = {
  title: {
    default: "Sizvo Compressor — Make Files Smaller (Image & Video Compressor)",
    template: "%s | Sizvo"
  },
  description: "Sizvo Compressor — Make Files Smaller. Compress image to 20kb, 50kb, 100kb, 200kb, 500kb. Compress videos for WhatsApp, Discord, and Email without losing quality. 100% private, free, no signup.",
  keywords: [
    "compress image to 20kb", "compress image to 50kb", "compress image to 100kb", "compress image to 150kb", "compress image to 200kb",
    "compress image to 250kb", "compress image to 300kb", "compress image to 500kb", "compress image to 1mb", "compress photo to 100kb",
    "compress photo to 200kb", "reduce image size to 100kb", "reduce image size to 200kb", "reduce photo size to 100kb", "jpg compressor to 100kb",
    "jpg compressor to 200kb", "compress jpg to 100kb", "compress jpg to 200kb", "compress png to 100kb", "compress png to 200kb",
    "compress webp to 100kb", "image size reducer to 100kb", "photo size reducer", "image compressor to specific size", "image compressor by kb",
    "compress image for online form", "compress photo for online form", "compress image for application", "compress photo for application",
    "compress image for government form", "compress photo for government form", "compress photo for exam form", "compress image for exam form",
    "compress image to 100kb for application", "compress photo to 100kb for application", "photo under 100kb", "image under 100kb",
    "reduce passport photo size", "passport photo under 100kb", "signature image under 50kb", "signature image under 100kb",
    "compress photo for visa application", "compress image for job application", "compress video", "video compressor online",
    "compress video online", "reduce video size", "reduce video file size", "video size reducer", "compress mp4", "mp4 compressor",
    "compress mp4 online", "reduce mp4 size", "compress video to 8mb", "compress video to 10mb", "compress video to 16mb",
    "compress video to 20mb", "compress video to 25mb", "compress video to 50mb", "compress video to 100mb", "compress video under 8mb",
    "compress video under 10mb", "compress video under 25mb", "make video smaller", "shrink video file size", "compress video for whatsapp",
    "compress video for discord", "compress video for email", "compress video to send on whatsapp", "reduce video size for whatsapp",
    "compress whatsapp video", "compress video under whatsapp limit", "video too large for whatsapp", "video too large to send",
    "compress video for gmail", "compress video for email attachment", "reduce email attachment size", "compress image without losing quality",
    "compress photo without losing quality", "compress jpg without losing quality", "compress png without losing quality",
    "compress video without losing quality", "reduce image size without losing quality", "reduce video size without losing quality",
    "private image compressor", "secure image compressor", "private video compressor", "secure video compressor",
    "image compressor no signup", "image compressor no registration", "video compressor no signup", "compress files without uploading",
    "online compressor no signup", "free image compressor no signup", "bulk image compressor", "batch image compressor",
    "compress multiple images", "compress multiple photos", "compress images in bulk", "bulk photo compressor", "batch photo compression",
    "compress multiple jpg files", "compress multiple png files", "bulk jpg compressor", "bulk png compressor", "compress images and download zip"
  ],
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: "Sizvo Compressor — Make Files Smaller",
    description: "Make Files Smaller. Compress images and videos to exact KB and MB targets without quality loss. 100% private, no account needed.",
    type: "website",
    siteName: "Sizvo"
  },
  twitter: {
    card: "summary_large_image",
    title: "Sizvo Compressor — Make Files Smaller",
    description: "Make Files Smaller. Compress images and videos to exact KB and MB targets without quality loss. 100% private, no account needed."
  }
};

const baseUrl = getBaseUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "Sizvo Compressor",
      "alternateName": "Sizvo",
      "url": baseUrl,
      "description": "Make Files Smaller. Compress images and videos to exact KB and MB targets without quality loss. 100% private, free, no signup.",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "Organization",
      "name": "Sizvo",
      "url": baseUrl,
      "logo": `${baseUrl}/icon.svg`
    }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers><Header /><main>{children}</main><Footer /></Providers>
      </body>
    </html>
  );
}
