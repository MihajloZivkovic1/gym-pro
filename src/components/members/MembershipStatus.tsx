'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, formatCurrency } from '@/lib/utils';

interface MembershipStatusProps {
  member: {
    activeMembership?: {
      id: string;
      startDate: Date;
      endDate: Date;
      status: string;
      paymentStatus: string;
      lastPaymentDate?: Date;
      plan: {
        name: string;
        price: number;
        durationMonths: number;
      };
    };
    membershipStatus: string;
  };
}

export function MembershipStatus({ member }: MembershipStatusProps) {
  if (!member.activeMembership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎫 Trenutna članarina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nema aktivne članarine</p>
            <p className="text-sm text-gray-400">
              Dodajte novu članarinu da bi član mogao da koristi teretanu
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const membership = member.activeMembership;
  const today = new Date();
  const endDate = new Date(membership.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate progress percentage
  const startDate = new Date(membership.startDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  const getProgressColor = () => {
    if (member.membershipStatus === 'expired') return 'bg-red-500';
    if (member.membershipStatus === 'expiring') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusMessage = () => {
    if (member.membershipStatus === 'expired') {
      return `Istekla pre ${Math.abs(daysRemaining)} dana`;
    }
    if (member.membershipStatus === 'expiring') {
      return `Ističe za ${daysRemaining} dan${daysRemaining === 1 ? '' : 'a'}`;
    }
    return `Aktivna - još ${daysRemaining} dana`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎫 Trenutna članarina
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Plan Info */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{membership.plan.name} Plan</h3>
              <p className="text-gray-600">
                {formatCurrency(membership.plan.price)} / {membership.plan.durationMonths} mesec
                {membership.plan.durationMonths > 1 ? 'i' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Status plaćanja</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${membership.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                membership.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {membership.paymentStatus === 'PAID' ? 'Plaćeno' :
                  membership.paymentStatus === 'PENDING' ? 'Na čekanju' : 'Neplaćeno'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatDate(membership.startDate)}</span>
              <span className="font-medium">{getStatusMessage()}</span>
              <span>{formatDate(membership.endDate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Početak članstva</p>
              <p className="font-medium">{formatDate(membership.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Poslednje plaćanje</p>
              <p className="font-medium">
                {membership.lastPaymentDate
                  ? formatDate(membership.lastPaymentDate)
                  : 'Nema podataka'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}