'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { PaymentButton } from './PaymentButton';
import { DeleteModal } from './DeleteModal';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipStatus: 'active' | 'expiring' | 'expired';
  activeMembership?: {
    id: string;
    plan: { name: string; price: number };
    endDate: string;
  };
}

interface MemberListProps {
  members: Member[];
  onMemberUpdate: () => void;
}

export function MemberList({ members, onMemberUpdate }: MemberListProps) {
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);

  // Remove duplicates and ensure unique keys
  const uniqueMembers = useMemo(() => {
    const seen = new Set();
    return members.filter(member => {
      if (seen.has(member.id)) {
        console.warn(`Duplicate member found with ID: ${member.id}`);
        return false;
      }
      seen.add(member.id);
      return true;
    });
  }, [members]);

  const handleDeleteClick = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;

    setDeletingMember(memberToDelete.id);

    try {
      const response = await fetch(`/api/members/${memberToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onMemberUpdate();
        setShowDeleteModal(false);
        setMemberToDelete(null);
        // You could add a toast notification here instead of alert
      } else {
        alert('Greška pri brisanju člana');
      }
    } catch (error) {
      alert('Greška pri komunikaciji sa serverom');
    } finally {
      setDeletingMember(null);
    }
  };

  const handleDeleteCancel = () => {
    if (!deletingMember) {
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expiring: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };

    const labels = {
      active: '✅ Aktivna',
      expiring: '⚠️ Uskoro ističe',
      expired: '❌ Istekla'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.expired}`}>
        {labels[status as keyof typeof labels] || 'Nepoznato'}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Član
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Članarina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {uniqueMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <p className="text-lg">👥</p>
                      <p>Nema članova za prikaz</p>
                      <Link href="/admin/members/new">
                        <Button size="sm">Dodaj prvog člana</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                uniqueMembers.map((member, index) => (
                  <tr key={`${member.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone || 'Nema telefon'}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.activeMembership ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.activeMembership.plan.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ističe: {formatDate(member.activeMembership.endDate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Nema aktivne članarine</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.membershipStatus)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/members/${member.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        <Link href={`/admin/members/${member.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>

                        {/* Payment Button - prikaži ZA SVE članove koji imaju membership (aktivan ili istekao) */}
                        {(member.activeMembership || member.membershipStatus === 'expired') && (
                          <PaymentButton
                            member={member}
                            variant="small"
                            onPaymentSuccess={() => onMemberUpdate()}
                          />
                        )}

                        <button
                          onClick={() => handleDeleteClick(member.id, `${member.firstName} ${member.lastName}`)}
                          disabled={deletingMember === member.id}
                          className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingMember === member.id ? (
                            <span className="w-4 h-4">⏳</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          itemName={memberToDelete.name}
          itemType="člana"
          description="Da li ste sigurni da želite da obrišete člana:"
          warningMessage="Ova akcija će trajno obrisati člana i sve povezane podatke (članstva, plaćanja, notifikacije). Ova akcija se ne može poništiti."
          isDeleting={!!deletingMember}
        />
      )}
    </>
  );
}