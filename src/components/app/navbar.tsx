"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RadioTower } from 'lucide-react'; 
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/cell-locator', label: 'Locator', icon: RadioTower },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-card/70 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/cell-locator" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <RadioTower className="h-7 w-7" />
            <span className="font-headline text-2xl font-bold">TowerLocator</span>
          </Link>
          <div className="flex items-center space-x-1 sm:space-x-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-1.5 py-2 sm:px-2 rounded-md text-xs font-medium transition-colors duration-150 ease-in-out", 
                    "font-code",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  title={item.label}
                >
                  <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", 'sm:mr-1')} /> 
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
