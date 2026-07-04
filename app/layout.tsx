import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Rule #3: Relative path from app/ folder to root context/ folder
import { NotificationProvider } from "../context/NotificationContext";
import { ThemeProvider } from "../context/ThemeContext";
import { CallProvider } from "../context/CallContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AfriDam AI | Specialist Portal",
  description: "Secure clinical gateway for AfriDam AI medical specialists and consultants.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
    other: [{ rel: "icon", url: "/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Rule #5: suppressHydrationWarning is essential when using localStorage for theme/identity
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var savedTheme = localStorage.getItem('theme');
              var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              var theme = savedTheme || systemTheme;
              document.documentElement.classList.toggle('dark', theme === 'dark');
            } catch (_) {}
          `}
        </Script>
        <Script id="role-init" strategy="beforeInteractive">
          {`
            try {
              var sid = localStorage.getItem('specialistId') || localStorage.getItem('userId');
              var globalRaw = localStorage.getItem('specialistRole') || '';
              var perKey = sid ? localStorage.getItem('specialistRole:' + sid) : null;
              var ROLE_MAP = {
                SKINCARE_CONSULTANT: 'Skin Care Consultant',
                DERMATOLOGIST: 'Dermatologist',
                MEDICAL_OFFICER: 'Medical Officer',
                REGISTERED_NURSE: 'Registered Nurse',
                SPECIALIST: 'Specialist',
                DOCTOR: 'Doctor',
                NURSE: 'Nurse',
                CONSULTANT: 'Consultant'
              };
              function mapRaw(raw){
                var norm = ('' + raw).trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
                return ROLE_MAP[norm] || raw;
              }
              if (perKey) {
                // ensure per-key is normalized
                var mapped = mapRaw(perKey);
                localStorage.setItem('specialistRole:' + sid, mapped);
              }
            } catch (_) {}
          `}
        </Script>
        <ThemeProvider>
          {/* Rule #5: NotificationProvider acts as the Neural Root for real-time alerts */}
          <NotificationProvider>
            <CallProvider>
              {children}
            </CallProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
