'use client';

import { useAuthModal } from '@/context/AuthModalContext';

export default function CTASection() {
  const { openSignupModal, openLoginModal } = useAuthModal();
  return (
    <div className="bg-blue-700">
      <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          <span className="block">Ready to become a top trader?</span>
          <span className="block">Start sharing your trades today.</span>
        </h2>
        <p className="mt-4 text-lg leading-6 text-blue-200">
          Join thousands of traders already sharing their wins and strategies.
        </p>
        <button
          onClick={openSignupModal}
          className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
        >
          Get Started for Free
        </button>
        <p className="mt-3 text-sm text-blue-200">
          Already have an account?{' '}
          <button onClick={openLoginModal} className="text-white font-medium underline bg-transparent border-none p-0 cursor-pointer">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
