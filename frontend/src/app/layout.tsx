import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Civic Gym - Detective Zone',
    description: 'Fact-checking and logical fallacy detection.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-900 text-slate-50">{children}</body>
        </html>
    )
}
