'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { DeleteModal } from '@/components/members/DeleteModal';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  membershipStatus?: string;
  activeMembership?: {
    id: string;
    plan: {
      name: string;
    };
    endDate: string;
  };
}

interface EditMemberPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMemberPage({ params }: EditMemberPageProps) {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const { id } = use(params);

  // Fetch member data
  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await fetch(`/api/members/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch member');
        }

        const memberData = await response.json();
        setMember(memberData);
        setFormData({
          firstName: memberData.firstName || '',
          lastName: memberData.lastName || '',
          email: memberData.email || '',
          phone: memberData.phone || ''
        });
      } catch (error) {
        console.error('Error fetching member:', error);
        setError('Greška pri učitavanju podataka o članu');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update member');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/members');
      } else {
        throw new Error(result.error || 'Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      setError('Greška pri ažuriranju člana');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }

      const result = await response.json();

      if (result.success) {
        router.push('/members');
      } else {
        throw new Error(result.error || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      setError('Greška pri brisanju člana');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleting) {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Učitavanje...</span>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Član nije pronađen</h1>
          <Link
            href="/members"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Nazad na listu članova
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/members"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Nazad na listu članova
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Uređivanje člana
                </h1>
                <p className="text-gray-600 mt-1">
                  {member.firstName} {member.lastName}
                </p>
              </div>

              {member.activeMembership && (
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Trenutni plan:</span>
                  <div className="font-medium text-gray-900">
                    {member.activeMembership.plan.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white shadow-sm rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    Ime *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unesite ime"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Prezime *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unesite prezime"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unesite email adresu"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unesite broj telefona"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleting || saving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Obriši člana
                </button>

                <div className="flex gap-3">
                  <Link
                    href="/members"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Otkaži
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Member info */}
          <div className="mt-6 bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dodatne informacije</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Član od:</span>
                <div className="font-medium">
                  {new Date(member.createdAt).toLocaleDateString('sr-RS')}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Status članstva:</span>
                <div className="font-medium">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs ${member.membershipStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : member.membershipStatus === 'expiring'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {member.membershipStatus === 'active' && 'Aktivno'}
                    {member.membershipStatus === 'expiring' && 'Uskoro ističe'}
                    {member.membershipStatus === 'expired' && 'Isteklo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={`${member.firstName} ${member.lastName}`}
        itemType="člana"
        description="Da li ste sigurni da želite da obrišete člana:"
        warningMessage="Ova akcija će trajno obrisati člana i sve povezane podatke (članstva, plaćanja, notifikacije). Ova akcija se ne može poništiti."
        isDeleting={deleting}
      />
    </>
  );
}