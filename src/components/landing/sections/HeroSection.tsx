"use client"

import Link from "next/link"
import { useAuthModal } from "@/context/AuthModalContext"
import { TrendingUp, Users, Trophy } from "lucide-react"

export default function HeroSection() {
  const { openSignupModal } = useAuthModal()

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-background via-card to-background overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-accent/20 rounded-full blur-lg animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen px-4 pt-3 sm:px-6 lg:px-8">
          <div className="space-y-8 animate-slide-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-semibold">Strava for Traders</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              <span className="block text-balance">Track Trades Like</span>
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Athletes Track Workouts
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed text-pretty">
              Transform trading from isolated gambling into a social, competitive sport. Share wins, climb leaderboards,
              and learn from the community.
            </p>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="text-muted-foreground">10K+ Active Traders</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <span className="text-muted-foreground">$2M+ Tracked Volume</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={openSignupModal}
                className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">Start Trading Socially</span>
              </button>
              <Link
                href="/#features"
                className="px-8 py-4 bg-card text-card-foreground rounded-xl font-semibold text-lg border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 text-center"
              >
                See How It Works
              </Link>
            </div>
          </div>

          <div className="relative animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative bg-card/50 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-2xl">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full animate-glow"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-primary/50 rounded-full animate-float"></div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Live Trading Feed</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Live</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { user: "Alex_Trader", stock: "AAPL", gain: "+12.5%", time: "2m ago" },
                    { user: "Sarah_Inv", stock: "TSLA", gain: "+8.3%", time: "5m ago" },
                    { user: "Mike_Pro", stock: "NVDA", gain: "+15.2%", time: "8m ago" },
                  ].map((trade, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300 hover:scale-105 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {trade.user[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{trade.user}</div>
                          <div className="text-xs text-muted-foreground">{trade.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-accent">{trade.gain}</div>
                        <div className="text-xs text-muted-foreground">{trade.stock}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/30">
                  <div className="text-center text-sm text-muted-foreground">
                    Join the leaderboard and compete with traders worldwide
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
