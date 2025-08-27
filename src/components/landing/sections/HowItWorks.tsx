"use client"

import { LinkIcon, ShareIcon, TrophyIcon, PlayIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

const steps = [
  {
    name: "Connect & Sync",
    description:
      "Securely link your trading accounts with bank-level encryption. We only read your trades, never access your funds.",
    icon: LinkIcon,
    detail: "Supports 15+ major brokerages including Robinhood, E*Trade, TD Ameritrade, and more.",
  },
  {
    name: "Share & Learn",
    description:
      "Choose which trades to showcase. Share your wins, strategies, and insights while keeping your portfolio size private.",
    icon: ShareIcon,
    detail: "Control exactly what you share - from individual trades to overall performance metrics.",
  },
  {
    name: "Compete & Grow",
    description:
      "Rise through skill-based leaderboards. Compete on performance percentages, not account size, and learn from top traders.",
    icon: TrophyIcon,
    detail: "Join monthly challenges, sector competitions, and collaborative learning groups.",
  },
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-primary/20 rounded-full blur-2xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20 mb-6">
            <PlayIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">HOW IT WORKS</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
            From setup to success
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              in under 5 minutes
            </span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            Join the social trading revolution with our simple 3-step process. Start competing and learning from the
            best traders today.
          </p>
        </div>

        <div className="relative">
          {/* Animated connection lines */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-5xl">
            <div className="flex justify-between items-center px-32">
              <div className="w-32 h-0.5 bg-gradient-to-r from-primary/30 to-accent/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
              </div>
              <div className="w-32 h-0.5 bg-gradient-to-r from-accent/50 to-primary/30 relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.name}
                className="relative group cursor-pointer"
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
              >
                <div
                  className={`
                  relative bg-card/70 backdrop-blur-sm rounded-3xl p-8 border border-border/50 
                  transition-all duration-500 hover:shadow-2xl hover:-translate-y-4
                  ${activeStep === index ? "border-primary/50 shadow-xl scale-105" : ""}
                `}
                >
                  <div className="relative mb-8">
                    <div
                      className={`
                      w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent 
                      flex items-center justify-center shadow-lg mx-auto
                      transition-all duration-500 group-hover:scale-110 group-hover:rotate-6
                      ${activeStep === index ? "animate-glow" : ""}
                    `}
                    >
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center shadow-lg">
                      {index + 1}
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {step.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-pretty">{step.description}</p>

                    <div
                      className={`
                      overflow-hidden transition-all duration-500
                      ${activeStep === index ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}
                    `}
                    >
                      <div className="pt-4 border-t border-border/30">
                        <p className="text-sm text-muted-foreground/80 text-pretty">{step.detail}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`
                    absolute bottom-4 right-4 w-3 h-3 rounded-full bg-accent 
                    transition-all duration-300 
                    ${activeStep === index ? "opacity-100 scale-100" : "opacity-0 scale-50"}
                  `}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
