import React from 'react';
import { Navbar } from '../components/Navbar/Navbar';
import { Hero } from '../components/Hero/Hero';
import { Workspace } from '../components/Workspace/Workspace';
import { HowItWorks } from '../components/HowItWorks/HowItWorks';
import { Features } from '../components/Features/Features';
import { Footer } from '../components/Footer/Footer';

interface HomeProps {
  onOpenWorkspace?: () => void;
}

export const Home: React.FC<HomeProps> = () => {
  const scrollToWorkspace = () => {
    const el = document.getElementById('workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F0FAF6] dark:bg-[#111214] text-[#2E2E2E] dark:text-white overflow-x-hidden transition-colors duration-300">
      {/* 1. Floating Sticky Navbar */}
      <Navbar onOpenWorkspace={scrollToWorkspace} />

      {/* 2. HOME / HERO: 3D Canvas, Title, Subtitle, CTA */}
      <Hero onStartSimplifying={scrollToWorkspace} />

      {/* 3. WORKSPACE: Upload Documents, Take a Photo, Document Viewer, AI Form Guide */}
      <Workspace />

      {/* 4. HOW EASY FORM WORKS: Upload -> Select -> Understand */}
      <HowItWorks />

      {/* 5. DESIGNED FOR ABSOLUTE CLARITY: Supporting Feature Grid */}
      <Features />

      {/* 6. FOOTER / END */}
      <Footer onOpenWorkspace={scrollToWorkspace} />
    </div>
  );
};
