import { StatsCards } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Mail, FileDown } from 'lucide-react';
import Link from 'next/link';

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
    <div className="space-y-8">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Brze akcije</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/members/new">
              <Button className="w-full h-12 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Dodaj novog člana
              </Button>
            </Link>
            <Button variant="secondary" className="w-full h-12 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pošalji podsetke
            </Button>
            <Button variant="secondary" className="w-full h-12 flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              Izvezi listu
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <RecentActivity activities={activities} />

        {/* Expiring Memberships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚠️ Uskoro ističe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringMemberships.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nema članova kojima uskoro ističe članarina
                </p>
              ) : (
                expiringMemberships.map((membership: any) => (
                  <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {membership.user.firstName} {membership.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Ističe: {new Date(membership.endDate).toLocaleDateString('sr-RS')}
                      </p>
                    </div>
                    <Link href={`/members/${membership.user.id}`}>
                      <Button size="sm">Pogledaj</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}