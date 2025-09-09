'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { Bell, Mail, CheckCircle, Clock } from 'lucide-react';

interface NotificationHistoryProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isSent: boolean;
    scheduledFor: Date;
    sentAt?: Date;
    createdAt: Date;
  }>;
}

export function NotificationHistory({ notifications }: NotificationHistoryProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP_EXPIRING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'MEMBERSHIP_EXPIRED':
        return <Bell className="w-4 h-4 text-red-600" />;
      case 'PAYMENT_REMINDER':
        return <Mail className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'MEMBERSHIP_EXPIRING': 'Članarina ističe',
      'MEMBERSHIP_EXPIRED': 'Članarina istekla',
      'PAYMENT_REMINDER': 'Podsetek za plaćanje'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          Istorija obaveštenja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nema istorije obaveštenja</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        {notification.isSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Poslato
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            <Clock className="w-3 h-3" />
                            Zakazano
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Tip:</span> {getTypeLabel(notification.type)}
                      </div>
                      <div>
                        <span className="font-medium">Zakazano za:</span> {formatDate(notification.scheduledFor)}
                      </div>
                      {notification.sentAt && (
                        <div>
                          <span className="font-medium">Poslato:</span> {formatDate(notification.sentAt)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Kreirano:</span> {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}