'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddMemberPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    membershipStart: new Date().toISOString().split('T')[0],
    membershipDuration: 1,
    planId: ''
  });

  // Fetch membership plans
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/membership-plans');
      const data = await response.json();
      if (data.plans) {
        setPlans(data.plans);
        if (data.plans.length > 0) {
          setFormData(prev => ({ ...prev, planId: data.plans[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Član je uspešno dodat!');
        router.push('/members');
      } else {
        alert(result.error || 'Greška pri dodavanju člana');
      }
    } catch (error) {
      alert('Greška pri komunikaciji sa serverom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/members">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Dodaj novog člana</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Osnovne informacije</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Početak članstva"
                type="date"
                value={formData.membershipStart}
                onChange={(e) => setFormData({ ...formData, membershipStart: e.target.value })}
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Trajanje članarine
                </label>
                <select
                  value={formData.membershipDuration}
                  onChange={(e) => setFormData({ ...formData, membershipDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 mesec</option>
                  <option value={3}>3 meseca</option>
                  <option value={6}>6 meseci</option>
                  <option value={12}>12 meseci</option>
                </select>
              </div>
            </div>

            {plans.length > 0 && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Plan članarine
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {plans.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price} RSD
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Link href="/members" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Otkaži
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? '⏳ Čuvanje...' : 'Dodaj člana'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}