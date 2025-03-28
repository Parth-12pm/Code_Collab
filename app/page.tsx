// app/page.tsx
import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Languages from "@/components/home/Languages";
import Footer from "@/components/home/Footer";


export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <Languages />
      <Footer />
    </main>
  );
}
