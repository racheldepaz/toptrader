"use client"

import { TrendingUp, Users, Shield, Link, BarChart3, Trophy } from "lucide-react"
import { useState } from "react"

const features = [
  {
    name: "Real-Time Social Feed",
    description:
      "See what top performers are trading right now. Follow their moves, learn their strategies, and get inspired by their wins.",
    icon: TrendingUp,
    color: "from-primary to-primary/80",
  },
  {
    name: "Performance Leaderboards",
    description:
      "Compete on global and friend leaderboards. Track your ranking across different timeframes and trading categories.",
    icon: Trophy,
    color: "from-accent to-accent/80",
  },
  {
    name: "Privacy-First Sharing",
    description:
      "Share your performance percentages, not dollar amounts. Keep your portfolio size private while showcasing your skills.",
    icon: Shield,
    color: "from-chart-2 to-chart-2/80",
  },
  {
    name: "Multi-Broker Integration",
    description: "Connect Robinhood, E*Trade, TD Ameritrade, and more. One dashboard for all your trading accounts.",
    icon: Link,
    color: "from-chart-1 to-chart-1/80",
  },
  {
    name: "Advanced Analytics",
    description:
      "Get detailed insights into your trading patterns, risk management, and performance metrics to improve your strategy.",
    icon: BarChart3,
    color: "from-chart-3 to-chart-3/80",
  },
  {
    name: "Community Challenges",
    description: "Join monthly trading challenges, sector-specific competitions, and collaborative learning groups.",
    icon: Users,
    color: "from-chart-4 to-chart-4/80",
  },
]

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-semibold">PLATFORM FEATURES</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            Everything you need to trade
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              like a pro athlete
            </span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            Transform your trading with social features, performance tracking, and community-driven insights that help
            you improve every day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="group relative"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div
                className={`
                relative bg-card/70 backdrop-blur-sm rounded-2xl p-8 border border-border/50 
                transition-all duration-500 hover:shadow-2xl hover:-translate-y-2
                ${hoveredFeature === index ? "border-primary/50 shadow-xl" : ""}
              `}
              >
                <div
                  className={`
                  relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} 
                  flex items-center justify-center mb-6 shadow-lg
                  transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                  ${hoveredFeature === index ? "animate-glow" : ""}
                `}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                  <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                  {feature.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-pretty">{feature.description}</p>

                <div
                  className={`
                  absolute bottom-4 right-4 w-2 h-2 rounded-full bg-primary 
                  transition-all duration-300 
                  ${hoveredFeature === index ? "opacity-100 scale-100" : "opacity-0 scale-50"}
                `}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-primary/5 rounded-2xl border border-primary/20">
            <span className="text-muted-foreground">Ready to level up your trading?</span>
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
