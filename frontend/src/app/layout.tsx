import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OutreachAI - Autonomous Recruiter Cold Outreach Agent',
  description: 'AI Background Agent sourcing jobs across free web platforms, matching candidate fit, and automating personalized recruiter outreach via Gmail.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-zinc-900 min-h-screen selection:bg-zinc-900 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
