
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, RadioTower, Binary, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Hub', icon: Home },
  { href: '/info-sleuth', label: 'InfoSleuth', icon: Search }, 
  { href: '/cell-locator', label: 'Cell Locator', icon: RadioTower },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-card/70 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <Binary className="h-7 w-7" />
            <span className="font-headline text-2xl font-bold">IntelSuite</span>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/info-sleuth' && pathname.startsWith('/info-sleuth'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out",
                    "font-code",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  title={item.label}
                >
                  <item.icon className={cn("h-5 w-5", item.href === '/' ? 'sm:mr-0' : 'sm:mr-2')} />
                  <span className={cn("hidden sm:inline", item.href === '/' ? 'sm:hidden': '')}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
