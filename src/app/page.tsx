import { StatsCards } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SwipeableCards } from '@/components/dashboard/SwipeableCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Mail, FileDown, Zap, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/statistics/ExportButton';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return await response.json();
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return {
      stats: { totalMembers: 0, activeMembers: 0, expiringMembers: 0, expiredMembers: 0 },
      activities: [],
      expiringMemberships: [],
      expiredMemberships: []
    };
  }
}

export default async function Dashboard() {
  const { stats, activities, expiringMemberships, expiredMemberships } = await getDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Dobrodošli nazad! 👋
            </h1>
            <p className="text-slate-600">Evo pregleda vašeg sistema za upravljanje članovima</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistem aktivan
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Quick Actions */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Brze akcije</CardTitle>
              <p className="text-sm text-slate-600 mt-1">Najčešće korišćene funkcije</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Add Member Card */}
            <Link href="/members/new" className="group block">
              <div className="relative bg-white rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                  <Plus className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Dodaj člana</h3>
                <p className="text-sm text-slate-600">Registruj novog člana</p>
              </div>
            </Link>

            {/* Newsletters Card */}
            <Link href="/newsletters" className="group block">
              <div className="relative bg-gray-50 rounded-2xl p-8 text-center transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 border border-gray-100 hover:border-gray-200">
                <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300">
                  <Mail className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Podsetnici</h3>
                <p className="text-sm text-slate-600">Pošalji obavestenja</p>
              </div>
            </Link>

            {/* Export Card */}
            <div className="group block cursor-pointer">
              <div className="relative bg-gray-50 rounded-2xl p-8 text-center transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 border border-gray-100 hover:border-gray-200">
                <div className="w-16 h-16 mx-auto mb-6 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 transition-colors duration-300">
                  <FileDown className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Export</h3>
                <div className="mt-4">
                  <ExportButton className="w-full" />
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Swipeable Membership Cards - Takes 1 column */}
        <div>
          <SwipeableCards
            expiredMemberships={expiredMemberships}
            expiringMemberships={expiringMemberships}
          />
        </div>

      </div>
    </div>
  );
}