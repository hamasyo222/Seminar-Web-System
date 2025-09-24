import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'セミナー管理システム',
    template: '%s | セミナー管理システム',
  },
  description: 'セミナーの申込・決済・受付を一元管理。オンライン・オフライン・ハイブリッド開催に対応した総合管理プラットフォーム。',
  keywords: ['セミナー', '研修', 'ウェビナー', 'イベント管理', '申込管理', '決済システム'],
  authors: [{ name: '株式会社サンプル' }],
  creator: '株式会社サンプル',
  publisher: '株式会社サンプル',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.BASE_URL || 'https://example.com'),
  openGraph: {
    title: 'セミナー管理システム',
    description: 'セミナーの申込・決済・受付を一元管理。オンライン・オフライン・ハイブリッド開催に対応。',
    url: '/',
    siteName: 'セミナー管理システム',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'セミナー管理システム',
    description: 'セミナーの申込・決済・受付を一元管理',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
        {/* Toast notifications */}
        <ToastProvider />
      </body>
    </html>
  )
}
