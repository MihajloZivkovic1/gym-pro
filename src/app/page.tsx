import { StatsCards } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Mail, FileDown, Zap, AlertTriangle, Activity, Calendar, ArrowRight } from 'lucide-react';
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
      expiringMemberships: []
    };
  }
}

export default async function Dashboard() {
  const { stats, activities, expiringMemberships } = await getDashboardData();

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
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/members/new" className="group">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <Plus className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Dodaj člana</p>
                    <p className="text-blue-100 text-sm">Registruj novog člana</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/newsletters" className="group">
              <div className="group">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300"></div>
                  <div className="relative z-10 flex items-center gap-3">
                    <Mail className="w-6 h-6" />
                    <div>
                      <p className="font-semibold">Podsetnici</p>
                      <p className="text-emerald-100 text-sm">Pošalji obavestenja</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <div className="group">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <FileDown className="w-6 h-6" />
                  <div>
                    <ExportButton className="w-full h-12 flex items-center gap-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity - Takes 2 columns */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">Poslednje aktivnosti</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">Najnovije promene u sistemu</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <span>Sve aktivnosti</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RecentActivity activities={activities} />
            </CardContent>
          </Card>
        </div>

        {/* Expiring Memberships - Takes 1 column */}
        <div>
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    Uskoro ističe
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Članovi koji treba da obnove</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expiringMemberships.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      Nema članova kojima uskoro ističe članarina
                    </p>
                  </div>
                ) : (
                  expiringMemberships.map((membership: any) => (
                    <div key={membership.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {membership.user.firstName.charAt(0)}{membership.user.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {membership.user.firstName} {membership.user.lastName}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Ističe: {new Date(membership.endDate).toLocaleDateString('sr-RS')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/members/${membership.user.id}`}>
                          <Button size="sm" variant="primary" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            Pogledaj
                          </Button>
                        </Link>
                      </div>

                      {/* Progress indicator */}
                      <div className="mt-3">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full"
                            style={{ width: `${Math.max(10, Math.min(90, ((new Date(membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)) * 100))}%` }}>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}