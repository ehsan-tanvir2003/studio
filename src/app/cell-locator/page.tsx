
"use client";

import CellTowerLocatorForm from '@/components/app/cell-tower-locator-form';
import { RadioTower } from "lucide-react";

export default function CellLocatorPage() {
  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <RadioTower className="mx-auto h-16 w-16 text-accent mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-accent">Tower Locator</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Triangulate Cell Signal (Bangladesh Network)
        </p>
      </header>

      <main className="w-full max-w-2xl">
        <CellTowerLocatorForm />
      </main>
    </div>
  );
}
