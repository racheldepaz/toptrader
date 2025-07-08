'use client';

import Link from 'next/link';
import { useAuthModal } from '@/context/AuthModalContext';

export default function HeroSection() {
  const { openSignupModal } = useAuthModal();
  return (
    <section className="relative bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block">Turn Your Trades</span>
                <span className="block text-blue-400">Into Trophies</span>
              </h1>
              <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Join the social trading revolution 🔥 Share your wins, learn from the best, and climb the leaderboard.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <button
                    onClick={openSignupModal}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                  >
                    Start Trading Socially
                  </button>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="/#features"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
          <div className="text-white text-center p-8">
            <div className="text-2xl font-bold mb-4">Trading Dashboard Preview</div>
            <div className="bg-black bg-opacity-30 p-4 rounded-lg inline-block">
              <div className="w-64 h-40 border-2 border-dashed border-white rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
