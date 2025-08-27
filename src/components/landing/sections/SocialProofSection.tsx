"use client"

import { Star, TrendingUp, Users, BarChart3 } from "lucide-react"
import { useState } from "react"

const testimonials = [
  {
    id: 1,
    quote: "TopTrader transformed my trading from guesswork to strategy. The community insights are game-changing.",
    author: "Alex Chen",
    role: "Day Trader",
    rating: 5,
    performance: "+127% this year",
    avatar: "AC",
  },
  {
    id: 2,
    quote:
      "Finally, a platform where I can share my wins without revealing my portfolio size. The privacy features are perfect.",
    author: "Jamie Rodriguez",
    role: "Swing Trader",
    rating: 5,
    performance: "+89% this year",
    avatar: "JR",
  },
  {
    id: 3,
    quote:
      "The leaderboard competition keeps me sharp. Learning from top traders has accelerated my growth exponentially.",
    author: "Taylor Morgan",
    role: "Options Trader",
    rating: 5,
    performance: "+156% this year",
    avatar: "TM",
  },
]

const stats = [
  {
    id: 1,
    name: "Active Traders",
    value: "12,500+",
    icon: Users,
    growth: "+23% this month",
  },
  {
    id: 2,
    name: "Trades Shared",
    value: "2.1M+",
    icon: BarChart3,
    growth: "+45% this month",
  },
  {
    id: 3,
    name: "Avg Performance",
    value: "18.7%",
    icon: TrendingUp,
    growth: "vs 12% market avg",
  },
  {
    id: 4,
    name: "Success Stories",
    value: "3,200+",
    icon: Star,
    growth: "verified wins",
  },
]

function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "text-accent fill-accent" : "text-muted-foreground/30"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function SocialProofSection() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)

  return (
    <section className="py-24 bg-gradient-to-b from-background to-card/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">COMMUNITY SUCCESS</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            Trusted by traders
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              worldwide
            </span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            Join thousands of successful traders who've transformed their performance through social trading and
            community insights.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 mb-20">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="group relative bg-card/70 backdrop-blur-sm rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="absolute -top-3 right-6 px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs font-bold shadow-lg">
                {testimonial.performance}
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {testimonial.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground">{testimonial.author}</h4>
                    <Rating rating={testimonial.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <blockquote className="text-muted-foreground leading-relaxed text-pretty">
                "{testimonial.quote}"
              </blockquote>

              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="group relative cursor-pointer"
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div
                className={`
                bg-card/70 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center
                transition-all duration-500 hover:shadow-xl hover:-translate-y-2
                ${hoveredStat === index ? "border-primary/50 shadow-lg" : ""}
              `}
              >
                <div
                  className={`
                  w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent 
                  flex items-center justify-center mx-auto mb-4 shadow-lg
                  transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                  ${hoveredStat === index ? "animate-glow" : ""}
                `}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{stat.name}</div>
                  <div className="text-xs text-muted-foreground">{stat.growth}</div>
                </div>

                <div
                  className={`
                  absolute top-2 right-2 w-2 h-2 rounded-full bg-accent 
                  transition-all duration-300 
                  ${hoveredStat === index ? "opacity-100 scale-100" : "opacity-0 scale-50"}
                `}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
