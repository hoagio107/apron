
"use client";

import Link from 'next/link';
import { ChefHat, Search, ShoppingCart, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">CookPal</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> My Cookbook
          </Link>
          <Link href="/shopping-list" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" /> Shopping List
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/recipes/new">
            <Button size="sm" className="hidden sm:flex gap-2">
              <Plus className="w-4 h-4" /> New Recipe
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="md:hidden">
            <Search className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold border border-primary/20">
            CP
          </div>
        </div>
      </div>
    </header>
  );
}
