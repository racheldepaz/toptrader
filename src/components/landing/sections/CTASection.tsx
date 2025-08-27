"use client"

import { useAuthModal } from "@/context/AuthModalContext"

export default function CTASection() {
  const { openSignupModal, openLoginModal } = useAuthModal()
  return (
    <div className="bg-gradient-to-r from-primary to-blue-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:60px_60px]"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center py-20 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-primary-foreground sm:text-5xl text-balance">
          <span className="block">Ready to become a top trader?</span>
          <span className="block mt-2">Start sharing your trades today.</span>
        </h2>
        <p className="mt-6 text-xl leading-relaxed text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
          Join thousands of traders already sharing their wins and strategies.
        </p>

        <div className="mt-10">
          <button
            onClick={openSignupModal}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-primary bg-primary-foreground hover:bg-primary-foreground/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started for Free
          </button>
          <p className="mt-6 text-primary-foreground/90">
            Already have an account?{' '}
            <button
              onClick={openLoginModal}
              className="text-primary-foreground font-semibold underline underline-offset-4 hover:text-primary-foreground/80 transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
