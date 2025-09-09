'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CreditCard, Banknote, Building2 } from 'lucide-react';

interface PaymentHistoryProps {
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    monthsPaid: number;
    notes?: string;
    membership: {
      plan: {
        name: string;
      };
    };
  }>;
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4 text-green-600" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      'cash': 'Gotovina',
      'card': 'Kartica',
      'bank_transfer': 'Bankarski prenos'
    };
    return labels[method as keyof typeof labels] || method;
  };

  // Calculate total payments
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-500" />
            Istorija plaćanja
          </span>
          <span className="text-sm font-normal text-gray-500">
            Ukupno: {formatCurrency(totalAmount)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nema istorije plaćanja</p>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                    <div>
                      <p className="font-semibold">{formatCurrency(Number(payment.amount))}</p>
                      <p className="text-sm text-gray-600">
                        {payment.membership.plan.name} - {payment.monthsPaid} mesec
                        {payment.monthsPaid > 1 ? 'i' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                    <p className="text-gray-500">{getPaymentMethodLabel(payment.paymentMethod)}</p>
                  </div>
                </div>

                {payment.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Napomena:</span> {payment.notes}
                    </p>
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