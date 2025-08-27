"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { Search } from "lucide-react"
import { useAuthModal } from "@/context/AuthModalContext"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useUserProfileQuery } from "@/hooks/useUserProfileQuery"
import UserProfileDropdown from "./UserProfileDropdown"

export default function Header() {
  const { openLoginModal, openSignupModal, setSignupStep } = useAuthModal()
  const { logout } = useSupabaseAuth()

  // Get data from React Query hook
  const { profile, loading, isAuthenticated, hasCompletedProfile, updateProfileCache, refreshProfile } =
    useUserProfileQuery()

  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // Handle search functionality
      console.log("Searching for:", searchQuery)
      // You can add navigation logic here
      // router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleCompleteProfile = () => {
    // Open signup modal and go to profile step
    setSignupStep("profile")
    openSignupModal()
  }

  // Show loading state while auth is resolving
  if (loading) {
    return (
      <header className="bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TopTrader
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo and Nav */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 group">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-accent/80 transition-all duration-300">
                TopTrader
              </h1>
            </Link>

            {/* Navigation - Only show when authenticated */}
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/feed"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 relative group"
                >
                  Feed
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  href="/leaderboards"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 relative group"
                >
                  Leaderboards
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link
                  href="/friends"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 relative group"
                >
                  Friends
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300"></span>
                </Link>
              </nav>
            )}
          </div>

          {/* Center: Search Bar (only when authenticated and profile complete) */}
          {isAuthenticated && hasCompletedProfile && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search traders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearch}
                    className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-card backdrop-blur-sm placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-primary text-sm text-foreground transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right side: Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <UserProfileDropdown
                profile={profile || null}
                hasCompletedProfile={hasCompletedProfile}
                onLogout={handleLogout}
                onCompleteProfile={handleCompleteProfile}
              />
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={openLoginModal}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-all duration-300 px-3 py-2 rounded-lg hover:bg-muted"
                >
                  Log in
                </button>
                <button
                  onClick={openSignupModal}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
