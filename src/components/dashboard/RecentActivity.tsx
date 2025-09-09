import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'payment' | 'new_member' | 'expiring';
  memberName: string;
  description: string;
  time: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment': return '💰';
      case 'new_member': return '👤';
      case 'expiring': return '⚠️';
      default: return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'payment': return 'text-green-600';
      case 'new_member': return 'text-blue-600';
      case 'expiring': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Nedavna aktivnost
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nema nedavne aktivnosti</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                <div className="flex-1">
                  <p className="font-medium">{activity.memberName}</p>
                  <p className={`text-sm ${getActivityColor(activity.type)}`}>
                    {activity.description}
                  </p>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}