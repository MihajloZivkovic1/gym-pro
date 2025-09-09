import { Card, CardContent } from '@/components/ui/Card';
import { Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';

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
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Aktivni',
      value: stats.activeMembers,
      icon: CheckCircle,
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Uskoro ističe',
      value: stats.expiringMembers,
      icon: AlertCircle,
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Istekli',
      value: stats.expiredMembers,
      icon: Clock,
      gradient: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className={`bg-gradient-to-r ${card.gradient} text-white p-6 rounded-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <Icon className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}