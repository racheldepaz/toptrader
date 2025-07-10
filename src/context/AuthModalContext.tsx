'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

export type SignupStep = 'email' | 'verify' | 'password' | 'profile' | 'brokerage';

interface AuthModalContextType {
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  signupStep: SignupStep;
  signupEmail: string;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openSignupModal: () => void;
  closeSignupModal: () => void;
  setSignupStep: (step: SignupStep) => void;
  setSignupEmail: (email: string) => void;
  resetSignupFlow: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  const [signupEmail, setSignupEmail] = useState('');

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openSignupModal = () => setIsSignupModalOpen(true);
  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
    // Don't reset the flow here - let it persist for email verification
  };

  const resetSignupFlow = () => {
    setSignupStep('email');
    setSignupEmail('');
  };

  return (
    <AuthModalContext.Provider
      value={{
        isLoginModalOpen,
        isSignupModalOpen,
        signupStep,
        signupEmail,
        openLoginModal,
        closeLoginModal,
        openSignupModal,
        closeSignupModal,
        setSignupStep,
        setSignupEmail,
        resetSignupFlow,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};