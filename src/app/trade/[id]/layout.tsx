import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Details - TopTrader',
  description: 'View detailed trade information and community discussion',
};

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}