'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, BarChart3, Bell, Menu, X, Newspaper, BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image'
export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Članovi', href: '/admin/members', icon: Users },
    { name: 'Obavestenja', href: '/admin/newsletters', icon: Newspaper },
    { name: 'Planovi Članarine', href: '/admin/membership-plans', icon: BadgeCheck },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border">
              <Image
                src="/ikonica512x512.png"
                alt="GymPro Logo"
                width={50}
                height={50}
              />
            </div>
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200">
              Gym<span className="text-orange-500">Pro</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User menu */}
          <div className="hidden md:flex items-center gap-4">
            <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">A</span>
            </div>
          </div>

          {/* Mobile menu button and user avatar */}
          <div className="md:hidden flex items-center gap-3">
            <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">A</span>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-white">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}