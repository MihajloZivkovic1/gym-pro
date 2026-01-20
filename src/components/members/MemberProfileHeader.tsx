'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Edit, CreditCard, Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PaymentModal } from '@/components/members/PaymentModal';
import { QRCodeModal } from '@/components/members/QrCodeModal';
import { DeleteModal } from './DeleteModal';
import { formatDate } from '@/lib/utils';

interface MemberProfileHeaderProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    qrCode?: string;
    createdAt: Date;
    membershipStatus: string;
    activeMembership?: any;
    stats: {
      totalPayments: number;
      totalCheckIns: number;
      memberSince: Date;
      totalMemberships: number;
    };
    role: string;
  };
}

export function MemberProfileHeader({ member }: MemberProfileHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  console.log("QR CODE:", member.qrCode);


  // Get current user's role from session
  const currentUserRole = session?.user?.role;
  const currentUserId = session?.user?.id;

  const canEdit = currentUserRole === 'ADMIN' || currentUserId === member.id;
  const isAdmin = currentUserRole === 'ADMIN';

  const editPath =
    currentUserRole === 'ADMIN'
      ? `/admin/members/${member.id}/edit`
      : `/member/${member.id}/edit`;

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expiring: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
    };

    const labels = {
      active: '✅ Aktivna',
      expiring: '⚠️ Ističe',
      expired: '❌ Istekla',
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs sm:text-sm font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.expired
          }`}
      >
        {labels[status as keyof typeof labels] || 'Nepoznat'}
      </span>
    );
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push('/admin/members');
        } else {
          alert(result.error || 'Greška pri brisanju člana');
        }
      } else {
        alert('Greška pri brisanju člana');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Greška pri komunikaciji sa serverom');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      {/* Header with back button and status */}
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 min-w-0">
          {currentUserRole !== 'MEMBER' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        {getStatusBadge(member.membershipStatus)}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Member Info */}
            <div className="lg:col-span-2">
              {/* Name and Avatar - Single Line */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {member.firstName} {member.lastName}
                </h2>
              </div>

              {/* Contact Info - Beneath Name */}
              <div className="mt-3 sm:mt-4 space-y-1.5 text-sm sm:text-base text-gray-600 ml-0">
                <p className="flex items-center gap-2 truncate">
                  <span className="flex-shrink-0">📧</span>
                  <span className="truncate">{member.email}</span>
                </p>
                {member.phone && (
                  <p className="flex items-center gap-2">
                    <span className="flex-shrink-0">📱</span>
                    {member.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <span className="flex-shrink-0">📅</span>
                  Član od: {formatDate(member.stats.memberSince)}
                </p>
              </div>

              {/* Member Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {member.stats.totalMemberships}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Ukupno članarina
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {Math.floor(
                      (new Date().getTime() -
                        new Date(member.stats.memberSince).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Dana kao član
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Akcije
              </h3>

              {/* QR Code Button */}

              <Button
                onClick={() => setShowQRModal(true)}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <QrCode className="w-4 h-4" />
                Prikaži QR kod
              </Button>


              {canEdit && (
                <Link href={editPath} className="block">
                  <Button className="w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5">
                    <Edit className="w-4 h-4" />
                    Uredi podatke
                  </Button>
                </Link>
              )}

              {member.activeMembership && isAdmin && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-sm sm:text-base py-2 sm:py-2.5"
                >
                  <CreditCard className="w-4 h-4" />
                  Naplati članarinu
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant="danger"
                  className="w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Obriši člana
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      {member.qrCode && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrCode={member.qrCode}
          memberName={`${member.firstName} ${member.lastName}`}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          member={member}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={`${member.firstName} ${member.lastName}`}
        itemType="člana"
        title="Obriši člana"
        description="Da li ste sigurni da želite da obrišete člana:"
        warningMessage="Ova akcija će trajno obrisati člana i sve povezane podatke (članstva, plaćanja, notifikacije, statistike). Ova akcija se ne može poništiti."
        isDeleting={isDeleting}
      />
    </>
  );
}