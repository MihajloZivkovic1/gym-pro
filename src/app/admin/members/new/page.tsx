'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, CreditCard, Banknote, Mail } from 'lucide-react';
import Link from 'next/link';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
}

export default function AddMemberPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [formData, setFormData] = useState({
    // Member info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Subscription preferences
    subscribeToNewsletter: true,
    subscribeToNotifications: true,

    // Membership info
    membershipStart: new Date().toISOString().split('T')[0],
    planId: '',

    // Payment info
    paymentAmount: 0,
    paymentMethod: 'cash',
    monthsPaid: 1,
    paymentNotes: ''
  });

  // Fetch membership plans
  useEffect(() => {
    fetchPlans();
  }, []);

  // Update payment amount when plan changes
  useEffect(() => {
    if (selectedPlan) {
      const monthlyPrice = selectedPlan.price;
      const totalAmount = monthlyPrice * formData.monthsPaid;
      setFormData(prev => ({
        ...prev,
        paymentAmount: totalAmount
      }));
    }
  }, [selectedPlan, formData.monthsPaid]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/membership-plans?isActive=true');
      const data = await response.json();

      if (data.success && data.data) {
        const activePlans = data.data.filter((plan: MembershipPlan) => plan.isActive);
        setPlans(activePlans);

        if (activePlans.length > 0) {
          const firstPlan = activePlans[0];
          setFormData(prev => ({
            ...prev,
            planId: firstPlan.id,
            paymentAmount: firstPlan.price
          }));
          setSelectedPlan(firstPlan);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('Greška pri učitavanju planova članarine');
    }
  };

  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    setSelectedPlan(plan || null);
    setFormData(prev => ({
      ...prev,
      planId,
    }));
  };

  const handleMonthsPaidChange = (months: number) => {
    setFormData(prev => ({
      ...prev,
      monthsPaid: months
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      alert('Molimo izaberite plan članarine');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Member data
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,

          // Subscription preferences
          subscribeToNewsletter: formData.subscribeToNewsletter,
          subscribeToNotifications: formData.subscribeToNotifications,

          // Membership data
          membershipStart: formData.membershipStart,
          planId: formData.planId,

          // Payment data
          payment: {
            amount: formData.paymentAmount,
            paymentMethod: formData.paymentMethod,
            monthsPaid: formData.monthsPaid,
            notes: formData.paymentNotes || null,
            paymentDate: formData.membershipStart
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Član je uspešno dodat i prvo plaćanje je zabeleženo!');
        router.push('/admin/members');
      } else {
        alert(result.error || 'Greška pri dodavanju člana');
      }
    } catch (error) {
      console.error('Greška pri komunikaciji sa serverom', error);
      alert('Greška pri komunikaciji sa serverom');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/members">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Dodaj novog člana</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Member Information */}
        <Card>
          <CardHeader>
            <CardTitle>Osnovne informacije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ime"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                label="Prezime"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            {/* Subscription Preferences */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Pretplate i obaveštenja</h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.subscribeToNewsletter}
                    onChange={(e) => setFormData({
                      ...formData,
                      subscribeToNewsletter: e.target.checked
                    })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Newsletter pretplata
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Član će primati obaveštenja o održavanju, događajima i opšte informacije
                    </p>
                  </div>
                </label>
              </div>

              {!formData.subscribeToNewsletter && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Član neće primati nikakva obaveštenja. Možete ovo promeniti kasnije u profilu člana.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Membership Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informacije o članstvu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Početak članstva"
              type="date"
              value={formData.membershipStart}
              onChange={(e) => setFormData({ ...formData, membershipStart: e.target.value })}
              required
            />

            {plans.length > 0 ? (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Plan članarine
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)}/mesec
                    </option>
                  ))}
                </select>
                {selectedPlan && (
                  <p className="text-sm text-gray-600">
                    Standardno trajanje: {selectedPlan.durationMonths} mesec(a)
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Nema aktivnih planova članarine. Kreirajte plan pre dodavanja člana.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Prvo plaćanje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Broj meseci unapred
              </label>
              <select
                value={formData.monthsPaid}
                onChange={(e) => handleMonthsPaidChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1 mesec</option>
                <option value={2}>2 meseca</option>
                <option value={3}>3 meseca</option>
                <option value={6}>6 meseci</option>
                <option value={12}>12 meseci</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Iznos plaćanja
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">RSD</span>
                </div>
              </div>
              {selectedPlan && formData.monthsPaid && (
                <p className="text-sm text-gray-600">
                  Preporučeno: {formatCurrency(selectedPlan.price * formData.monthsPaid)}
                  ({formData.monthsPaid} × {formatCurrency(selectedPlan.price)})
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Napomene o plaćanju (opciono)
              </label>
              <textarea
                value={formData.paymentNotes}
                onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Dodatne informacije o plaćanju..."
              />
            </div>

            {/* Payment Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Pregled plaćanja</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span>{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meseci:</span>
                  <span>{formData.monthsPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Način plaćanja:</span>
                  <span>💰 Keš</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-blue-200">
                  <span>Ukupno:</span>
                  <span>{formatCurrency(formData.paymentAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Link href="/admin/members" className="flex-1">
            <Button variant="secondary" className="w-full">
              Otkaži
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || plans.length === 0}
          >
            {loading ? '⏳ Dodavanje...' : 'Dodaj člana i zabeleži plaćanje'}
          </Button>
        </div>
      </form>
    </div>
  );
}