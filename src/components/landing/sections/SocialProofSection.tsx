import { StarIcon } from '@heroicons/react/24/solid';

const testimonials = [
  {
    id: 1,
    quote: "TopTrader has completely changed how I approach trading. The community insights are invaluable.",
    author: 'Alex K.',
    role: 'Day Trader',
    rating: 5,
  },
  {
    id: 2,
    quote: "I love being able to share my trades without revealing my portfolio size. It's all about the percentage gains!",
    author: 'Jamie R.',
    role: 'Swing Trader',
    rating: 5,
  },
  {
    id: 3,
    quote: "The leaderboard competition keeps me motivated to improve my strategy. Best trading community out there.",
    author: 'Taylor M.',
    role: 'Options Trader',
    rating: 5,
  },
];

const stats = [
  { id: 1, name: 'Traders sharing their wins', value: '1,000+' },
  { id: 2, name: 'Trades shared this month', value: '25,000+' },
  { id: 3, name: 'Average monthly return', value: '12.5%' },
  { id: 4, name: 'Brokerages supported', value: '5+' },
];

function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function SocialProofSection() {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Community</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Join thousands of traders
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            See why traders love sharing their journey on TopTrader
          </p>
        </div>

        <div className="mt-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 p-6 rounded-lg">
                <Rating rating={testimonial.rating} />
                <blockquote className="mt-4">
                  <p className="text-lg text-gray-700">"{testimonial.quote}"</p>
                </blockquote>
                <div className="mt-4">
                  <p className="font-medium text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <dt className="text-4xl font-extrabold text-blue-600">{stat.value}</dt>
                <dd className="mt-2 text-sm font-medium text-gray-500">{stat.name}</dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
