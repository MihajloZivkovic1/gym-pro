'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteModal } from '@/components/members/DeleteModal';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    memberships: number;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FormData {
  name: string;
  price: string;
  durationMonths: string;
  isActive: boolean;
}

export default function MembershipPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    durationMonths: '',
    isActive: true
  });

  useEffect(() => {
    fetchPlans();
  }, [pagination.page, filterActive]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (filterActive !== 'all') {
        params.append('isActive', filterActive);
      }

      const response = await fetch(`/api/membership-plans?${params}`);
      const data = await response.json();

      if (data.success) {
        setPlans(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Greška pri učitavanju planova');
      }
    } catch (err) {
      setError('Greška pri učitavanju planova');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: MembershipPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        durationMonths: plan.durationMonths.toString(),
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: '',
        durationMonths: '',
        isActive: true
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      price: '',
      durationMonths: '',
      isActive: true
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        durationMonths: parseInt(formData.durationMonths),
        isActive: formData.isActive
      };

      const url = editingPlan
        ? `/api/membership-plans/${editingPlan.id}`
        : '/api/membership-plans';

      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        handleCloseModal();
        fetchPlans();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // Handle validation errors
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) =>
            `${err.field}: ${err.message}`
          ).join(', ');
          setError(errorMessages);
        } else {
          setError(data.error || 'Greška pri čuvanju plana');
        }
      }
    } catch (err) {
      setError('Greška pri čuvanju plana');
    }
  };

  const handleDelete = (plan: MembershipPlan) => {
    setPlanToDelete(plan);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/membership-plans/${planToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Plan članarine je uspešno deaktiviran');
        setShowDeleteModal(false);
        setPlanToDelete(null);
        fetchPlans();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Greška pri brisanju plana');
        setShowDeleteModal(false);
        setPlanToDelete(null);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Greška pri brisanju plana');
      setShowDeleteModal(false);
      setPlanToDelete(null);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/membership-plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        fetchPlans();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Greška pri promeni statusa');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('Greška pri promeni statusa');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Planovi članarine</h1>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
        >
          <span className="sm:hidden">+ Dodaj plan</span>
          <span className="hidden sm:inline">+ Dodaj novi plan</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm sm:text-base">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 sm:mb-6">
        <label className="block sm:inline mr-2 font-medium text-sm sm:text-base mb-2 sm:mb-0">Filter:</label>
        <select
          value={filterActive}
          onChange={(e) => {
            setFilterActive(e.target.value);
            setPagination({ ...pagination, page: 1 });
          }}
          className="w-full sm:w-auto border rounded px-3 py-2 text-sm sm:text-base"
        >
          <option value="all">Svi planovi</option>
          <option value="true">Aktivni</option>
          <option value="false">Neaktivni</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Naziv
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cena
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trajanje
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Članovi
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcije
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                        Nema pronađenih planova
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {plan.name}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatPrice(plan.price)}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {plan.durationMonths} {plan.durationMonths === 1 ? 'mesec' : 'meseca'}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {plan._count.memberships}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <button
                            // onClick={() => handleToggleActive(plan.id, plan.isActive)}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {plan.isActive ? 'Aktivan' : 'Neaktivan'}
                          </button>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-1 lg:space-y-0">
                            <button
                              onClick={() => handleOpenModal(plan)}
                              className="text-blue-600 hover:text-blue-900 text-left"
                            >
                              Izmeni
                            </button>
                            <button
                              onClick={() => handleDelete(plan)}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              Obriši
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {plans.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Nema pronađenih planova
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
                  {/* Plan Name and Status */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">
                      {plan.name}
                    </h3>
                    <button
                      // onClick={() => handleToggleActive(plan.id, plan.isActive)}
                      className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${plan.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {plan.isActive ? 'Aktivan' : 'Neaktivan'}
                    </button>
                  </div>

                  {/* Plan Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Cena:</span>
                      <div className="text-gray-900 font-semibold">{formatPrice(plan.price)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Trajanje:</span>
                      <div className="text-gray-900">
                        {plan.durationMonths} {plan.durationMonths === 1 ? 'mesec' : 'meseca'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 font-medium">Broj članova: </span>
                      <span className="text-gray-900 font-semibold">{plan._count.memberships}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleOpenModal(plan)}
                      className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-100 transition"
                    >
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(plan)}
                      className="flex-1 bg-red-50 text-red-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-red-100 transition"
                    >
                      Obriši
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center mt-6 space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="w-full sm:w-auto px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Prethodna
              </button>
              <span className="px-4 py-2 text-sm">
                Strana {pagination.page} od {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="w-full sm:w-auto px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Sledeća
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                {editingPlan ? 'Izmeni plan' : 'Novi plan članarine'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Naziv plana
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base"
                    required
                    minLength={2}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Cena (RSD)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Trajanje (meseci)
                  </label>
                  <input
                    type="number"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm sm:text-base"
                    required
                    min="1"
                    max="24"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 text-sm font-bold">Aktivan plan</span>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
                  >
                    Otkaži
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base order-1 sm:order-2"
                  >
                    {editingPlan ? 'Sačuvaj izmene' : 'Kreiraj plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPlanToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Deaktivacija plana članarine"
        itemName={planToDelete?.name || ''}
        itemType="plan članarine"
        description="Da li ste sigurni da želite da deaktivirate ovaj plan:"
        isDeleting={isDeleting}
        warningMessage={
          planToDelete && planToDelete._count.memberships > 0
            ? `Ovaj plan trenutno koristi ${planToDelete._count.memberships} član(ova). Plan će biti deaktiviran, ali postojeći članovi mogu nastaviti da koriste ovaj plan.`
            : 'Plan će biti deaktiviran i neće biti dostupan za nove članove.'
        }
      />
    </div>
  );
}