import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'World Cup Predictions', description: 'Office prediction league' }
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
