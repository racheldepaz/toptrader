'use client';

import { ReactNode } from 'react';
import Head from 'next/head';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import HowItWorks from './sections/HowItWorks';
import SocialProofSection from './sections/SocialProofSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';
import { useAuthModal } from '@/context/AuthModalContext';

interface LandingPageProps {
  children?: ReactNode;
}

export default function LandingPage({ children }: LandingPageProps) {
  const { 
    isLoginModalOpen, 
    closeLoginModal, 
    isSignupModalOpen, 
    closeSignupModal 
  } = useAuthModal();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>TopTrader - Social Trading Platform</title>
        <meta name="description" content="Join the social trading revolution. Share your wins, learn from the best, and climb the leaderboards." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="overflow-hidden">
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <SocialProofSection />
        <CTASection />
      </main>

      <Footer />
      
      {/* Auth Modals */}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <SignupModal isOpen={isSignupModalOpen} onClose={closeSignupModal} />
    </div>
  );
}
