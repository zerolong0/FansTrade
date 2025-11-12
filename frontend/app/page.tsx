import { Hero } from '@/components/layout/Hero';
import { Navbar } from '@/components/layout/Navbar';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
    </main>
  );
}
