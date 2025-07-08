import { UserGroupIcon, ShareIcon, TrophyIcon } from '@heroicons/react/24/outline';

const steps = [
  {
    name: 'Connect Your Brokerage',
    description: 'Securely link your trading accounts with our read-only API access. Your credentials stay safe.',
    icon: UserGroupIcon,
  },
  {
    name: 'Share Your Trades',
    description: 'Choose which trades to share and customize your privacy settings. Show percentages, not dollar amounts.',
    icon: ShareIcon,
  },
  {
    name: 'Climb the Leaderboards',
    description: 'Compete on performance, not account size. Rise through the ranks based on your trading skills.',
    icon: TrophyIcon,
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">How it works</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Get started in minutes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Join thousands of traders sharing their best moves and strategies.
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {steps.map((step, index) => (
              <div key={step.name} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-16">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-blue-600">Step {index + 1}</span>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mt-1">{step.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
