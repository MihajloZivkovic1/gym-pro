import { Card, CardContent } from '@/components/ui/Card';
import { Users, CheckCircle, AlertCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface StatsCardsProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    expiringMembers: number;
    expiredMembers: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Ukupno članova',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      subtitle: 'Svi registrovani',

    },
    {
      title: 'Aktivni članovi',
      value: stats.activeMembers,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      subtitle: 'Trenutno aktivni',

    },
    {
      title: 'Uskoro ističe',
      value: stats.expiringMembers,
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      subtitle: 'Narednih 30 dana',

    },
    {
      title: 'Istekli',
      value: stats.expiredMembers,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      subtitle: 'Potrebno obnavljanje',

    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;


        return (
          <Link key={index} href="/admin/members" className="block">
            <Card className={`group border ${card.borderColor} hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-white cursor-pointer`}>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>

                {/* Main content */}
                <div className="space-y-1">
                  <p className="text-slate-600 text-sm font-medium">{card.title}</p>
                  <p className="text-slate-900 text-2xl font-bold">{card.value.toLocaleString()}</p>
                  <p className="text-slate-500 text-xs">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}