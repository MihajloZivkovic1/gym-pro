'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Mail, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PaymentModal } from '@/components/members/PaymentModal';
import { formatDate } from '@/lib/utils';

interface MemberProfileHeaderProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    createdAt: Date;
    membershipStatus: string;
    activeMembership?: any;
    stats: {
      totalPayments: number;
      totalCheckIns: number;
      memberSince: Date;
      totalMemberships: number;
    };
  };
}

export function MemberProfileHeader({ member }: MemberProfileHeaderProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expiring: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };

    const labels = {
      active: '✅ Aktivna članarina',
      expiring: '⚠️ Uskoro ističe',
      expired: '❌ Istekla članarina'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.expired}`}>
        {labels[status as keyof typeof labels] || 'Nepoznat status'}
      </span>
    );
  };

  const handleSendReminder = async () => {
    try {
      const response = await fetch(`/api/members/${member.id}/send-reminder`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        alert('Podsetek je uspešno poslat!');
      } else {
        alert(result.error || 'Greška pri slanju podsetka');
      }
    } catch (error) {
      alert('Greška pri komunikaciji sa serverom');
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/members">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {member.firstName} {member.lastName}
        </h1>
        {getStatusBadge(member.membershipStatus)}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Member Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {member.firstName} {member.lastName}
                  </h2>
                  <div className="space-y-1 text-gray-600">
                    <p className="flex items-center gap-2">
                      📧 {member.email}
                    </p>
                    {member.phone && (
                      <p className="flex items-center gap-2">
                        📱 {member.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      📅 Član od: {formatDate(member.stats.memberSince)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{member.stats.totalMemberships}</p>
                  <p className="text-sm text-gray-500">Ukupno članarina</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('sr-RS').format(member.stats.totalPayments)}
                  </p>
                  <p className="text-sm text-gray-500">Ukupno plaćeno (RSD)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{member.stats.totalCheckIns}</p>
                  <p className="text-sm text-gray-500">Dolasci u teretanu</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.floor((new Date().getTime() - new Date(member.stats.memberSince).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                  <p className="text-sm text-gray-500">Dana kao član</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Akcije</h3>

              <Link href={`/members/${member.id}/edit`} className="block">
                <Button className="w-full flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Uredi podatke
                </Button>
              </Link>

              {member.activeMembership && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  variant="secondary"
                  className="w-full flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <CreditCard className="w-4 h-4" />
                  Naplati članarinu
                </Button>
              )}

              <Button
                onClick={handleSendReminder}
                variant="secondary"
                className="w-full flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Pošalji podsetek
              </Button>

              <Button
                variant="danger"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  if (confirm(`Da li ste sigurni da želite da obrišete ${member.firstName} ${member.lastName}?`)) {
                    // Handle delete
                    window.location.href = '/members';
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Obriši člana
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showPaymentModal && (
        <PaymentModal
          member={member}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            window.location.reload(); // Refresh the page to show updated data
          }}
        />
      )}
    </>
  );
}