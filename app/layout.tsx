import type { Metadata } from 'next'
import '../styles/globals.css'
import { Window as KeplrWindow } from '@keplr-wallet/types'

declare global {
  interface Window extends KeplrWindow {}
}

export const metadata: Metadata = {
  title: {
    template: '%s | Extended Bech32 Converter',
    default: 'Extended Bech32 Converter | Online Tool',
  },
  description: 'Extended Bech32 Online Tool(Encoder/Decoder/Converter) To convert Bech32 addresses to different formats and vice versa. Supports major cryptocurrencies.',
  icons: {
    icon: '/favicon32.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col h-screen">
          <div>{children}</div>
        </div>
      </body>
    </html>
  )
}
