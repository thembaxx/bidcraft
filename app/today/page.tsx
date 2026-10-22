import Link from 'next/link';
import type { Metadata } from 'next';
import { BrandWordmark } from '@/components/brand-logo';
import { SettingsMenu } from '@/components/settings-menu';
import { MobileGlobalNav } from '@/components/mobile-global-nav';
import { TodayDashboard } from '@/components/today-dashboard';

export const metadata: Metadata = {
  title: 'Today',
  description: 'Keep track of saved South African tenders, upcoming deadlines and your next bid preparation steps.',
};

export default function TodayPage() {
  return <div id="workspace" className="min-h-dvh bg-[#F8F6EF] pb-28 text-[#101714] dark:bg-[#0D0F0E] dark:text-[#f2f5f0] lg:pb-12">
    <header className="sticky top-0 z-30 border-b border-neutral-200/75 bg-[#F8F6EF]/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-[#0D0F0E]/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <BrandWordmark />
        <div className="flex shrink-0 items-center gap-4">
          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm font-semibold text-neutral-600 dark:text-neutral-300 lg:flex">
            <Link href="/today" aria-current="page" className="text-[#168B7A] dark:text-[#9BDBBE]">Today</Link>
            <Link href="/tenders" className="hover:text-[#168B7A]">Discover</Link>
            <Link href="/#workspace" className="hover:text-[#168B7A]">My bids</Link>
          </nav>
          <SettingsMenu />
        </div>
      </div>
    </header>
    <TodayDashboard />
    <MobileGlobalNav />
  </div>;
}
