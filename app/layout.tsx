import type { Metadata } from 'next'
import '../styles/globals.css'
import { Window as KeplrWindow } from '@keplr-wallet/types'

declare global {
  interface Window extends KeplrWindow {}
}

export const metadata: Metadata = {
  title: {
    template: '%s | Extended Bech32 Converter',
    default: 'Extended Bech32 Converter',
  },
  description: 'Extended Bech32 Converter',
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
