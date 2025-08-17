
import { RadioTower } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background animate-pulse">
      <RadioTower className="w-24 h-24 text-primary" />
      <h1 className="mt-6 text-3xl font-headline text-primary">
        Tower Locator
      </h1>
      <p className="mt-2 text-muted-foreground font-code">Loading Network Data...</p>
    </div>
  );
}
