import { CheckCircleIcon, ChartBarIcon, ShieldCheckIcon, LinkIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Social Trading Feed',
    description: 'See what top traders are buying and selling in real-time',
    icon: ChartBarIcon,
  },
  {
    name: 'Performance Leaderboards',
    description: 'Compete with friends and climb the global rankings',
    icon: ChartBarIcon,
  },
  {
    name: 'Privacy First',
    description: 'Share your wins, keep your wallet private - show percentages, not dollars',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Multiple Brokerages',
    description: 'Connect Robinhood, E*Trade, and more with secure integration',
    icon: LinkIcon,
  },
];

export default function FeaturesSection() {
  return (
    <div id="features" className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            A better way to trade socially
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Trade with confidence, learn from the best, and grow your portfolio.
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
