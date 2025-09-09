'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Building2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentModalProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    activeMembership?: {
      id: string;
      plan: {
        name: string;
        price: number;
        durationMonths: number;
      };
      endDate: string;
    };
  };
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
}

export function PaymentModal({ member, onClose, onSuccess }: PaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: member.activeMembership?.plan.price || 0,
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer',
    monthsPaid: 1,
    notes: '',
    processedBy: 'admin'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  const isExpiredMembership = () => {
    if (!member.activeMembership) return true;
    const endDate = new Date(member.activeMembership.endDate);
    return endDate < new Date();
  };

  // Calculate new end date when months change
  const calculateNewEndDate = () => {
    if (!member.activeMembership) {
      // If no membership at all, start from today
      const today = new Date();
      today.setMonth(today.getMonth() + formData.monthsPaid);
      return formatDate(today);
    }

    const currentEnd = new Date(member.activeMembership.endDate);

    // If membership is expired, start from today
    if (currentEnd < new Date()) {
      const today = new Date();
      today.setMonth(today.getMonth() + formData.monthsPaid);
      return formatDate(today);
    } else {
      // If still active, extend current end date
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + formData.monthsPaid);
      return formatDate(newEnd);
    }
  };

  const getModalTitle = () => {
    if (isExpiredMembership()) {
      return '🔄 Reaktiviraj članarinu';
    }
    return '💳 Naplati članarinu';
  };


  // Update amount when months change
  useEffect(() => {
    if (member.activeMembership) {
      const monthlyPrice = member.activeMembership.plan.price;
      setFormData(prev => ({
        ...prev,
        amount: monthlyPrice * formData.monthsPaid
      }));
    }
  }, [formData.monthsPaid, member.activeMembership]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Iznos mora biti veći od 0';
    }

    if (formData.monthsPaid < 1 || formData.monthsPaid > 24) {
      newErrors.monthsPaid = 'Broj meseci mora biti između 1 i 24';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/members/${member.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result);
        alert(`✅ Plaćanje uspešno!\nČlanarina produžena za ${formData.monthsPaid} mesec${formData.monthsPaid > 1 ? 'i' : ''}.\nNova važi do: ${calculateNewEndDate()}`);
      } else {
        alert(`❌ Greška: ${result.error || 'Neuspešno plaćanje'}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('❌ Greška pri komunikaciji sa serverom');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    {
      value: 'cash' as const,
      label: 'Gotovina',
      icon: Banknote,
      color: 'text-green-600'
    },
    {
      value: 'card' as const,
      label: 'Kartica',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      value: 'bank_transfer' as const,
      label: 'Prenos',
      icon: Building2,
      color: 'text-purple-600'
    }
  ];

  const monthOptions = [
    { value: 1, label: '1 mesec' },
    { value: 2, label: '2 meseca' },
    { value: 3, label: '3 meseca' },
    { value: 6, label: '6 meseci' },
    { value: 12, label: '12 meseci' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold">💳 Naplati članarinu</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {member.firstName[0]}{member.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-gray-600">{member.email}</p>
              {member.activeMembership && (
                <p className="text-sm text-blue-600">
                  {member.activeMembership.plan.name} - {formatCurrency(member.activeMembership.plan.price)}/mesečno
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Iznos za naplatu
            </label>
            <div className="relative">
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="text-lg font-semibold pl-12"
                step="0.01"
                min="0"
                error={errors.amount}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                RSD
              </span>
            </div>
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Način plaćanja
            </label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map(method => {
                const Icon = method.icon;
                const isSelected = formData.paymentMethod === method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 text-sm font-medium transition-all ${isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : method.color}`} />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Months Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Broj meseci
            </label>
            <select
              value={formData.monthsPaid}
              onChange={(e) => setFormData({ ...formData, monthsPaid: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.monthsPaid && (
              <p className="text-red-600 text-sm mt-1">{errors.monthsPaid}</p>
            )}
          </div>

          {/* Calculation Preview */}
          {member.activeMembership && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Kalkulacija</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mesečna cena:</span>
                  <span className="font-medium">{formatCurrency(member.activeMembership.plan.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Broj meseci:</span>
                  <span className="font-medium">{formData.monthsPaid}</span>
                </div>
                <div className="flex justify-between border-t border-green-200 pt-2">
                  <span className="font-medium text-gray-800">Ukupno:</span>
                  <span className="font-bold text-green-800">{formatCurrency(formData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trenutno važi do:</span>
                  <span className="font-medium">{formatDate(member.activeMembership.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 font-medium">Nova važi do:</span>
                  <span className="font-bold text-green-800">{calculateNewEndDate()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Napomene (opciono)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Dodatne napomene o plaćanju..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Otkaži
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 mr-2 animate-spin">⏳</span>
                  Obrađuje se...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Naplati {formatCurrency(formData.amount)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}