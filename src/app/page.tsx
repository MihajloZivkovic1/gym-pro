"use client"
import React from 'react';
import { useRouter } from 'next/navigation'; // For App Router
import { Dumbbell } from 'lucide-react';


export default function GymLandingPage() {
  const router = useRouter();
  const handleLogin = () => {
    router.push('/auth/login')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-white">Sky Fitness</span>
          </div>
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Welcome
          </h1>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Your all-in-one platform for managing memberships, tracking workouts,
            and achieving fitness goals. Access your personalized dashboard now.
          </p>

          <button
            onClick={handleLogin}
            className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            Access Your Account.
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-20 border-t border-slate-800">
        <div className="text-center text-slate-500">
          <p>&copy; 2025 Sky Fitness. Internal Use Only.</p>
        </div>
      </footer>
    </div>
  );
}