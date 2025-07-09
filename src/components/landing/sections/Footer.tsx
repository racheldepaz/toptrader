import Link from 'next/link';
import { FaTwitter } from 'react-icons/fa';

const navigation = {
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Security', href: '/security' },
  ],
  social: [
    {
      name: 'Twitter',
      href: 'https://twitter.com/toptradergg',
      icon: FaTwitter,
    },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="mt-8 flex justify-center space-x-6">
          {navigation.legal.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm text-gray-400 hover:text-white">
              {item.name}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {new Date().getFullYear()} TopTrader. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
