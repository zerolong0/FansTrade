import { Hero } from '@/components/layout/Hero';
import { Navbar } from '@/components/layout/Navbar';

// Force dynamic rendering to resolve i18n
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
    </main>
  );
}
