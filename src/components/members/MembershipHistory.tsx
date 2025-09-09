'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface MembershipHistoryProps {
  memberships: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    paymentStatus: string;
    plan: {
      name: string;
      price: number;
    };
    payments: Array<{
      id: string;
      amount: number;
      paymentDate: Date;
    }>;
  }>;
}

export function MembershipHistory({ memberships }: MembershipHistoryProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'EXPIRED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };

    const labels = {
      'ACTIVE': 'Aktivna',
      'EXPIRED': 'Završena',
      'CANCELLED': 'Otkazana'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.EXPIRED}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Istorija članarina
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {memberships.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nema istorije članarina</p>
          ) : (
            memberships.map((membership) => (
              <div key={membership.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{membership.plan.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(membership.plan.price)}
                    </p>
                  </div>
                  {getStatusBadge(membership.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Period</p>
                    <p className="font-medium">
                      {formatDate(membership.startDate)} - {formatDate(membership.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Plaćanja</p>
                    <p className="font-medium">
                      {membership.payments.length} uplata
                    </p>
                  </div>
                </div>

                {/* Payment mini-list */}
                {membership.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Poslednje uplate:</p>
                    <div className="space-y-1">
                      {membership.payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center text-xs">
                          <span>{formatDate(payment.paymentDate)}</span>
                          <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
                        </div>
                      ))}
                      {membership.payments.length > 3 && (
                        <p className="text-xs text-gray-400 text-center">
                          +{membership.payments.length - 3} više...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}