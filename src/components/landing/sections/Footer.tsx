import Link from "next/link"
import { FaTwitter } from "react-icons/fa"

const navigation = {
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", href: "/security" },
  ],
  social: [
    {
      name: "Twitter",
      href: "https://twitter.com/toptradergg",
      icon: FaTwitter,
    },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">TopTrader</h3>
            <p className="mt-2 text-slate-400">The social trading revolution</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {navigation.legal.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-slate-400 hover:text-white transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex space-x-6">
            {navigation.social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-slate-400 hover:text-white transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" />
              </a>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-700 w-full text-center">
            <p className="text-slate-400">&copy; {new Date().getFullYear()} TopTrader. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
