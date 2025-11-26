'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Building2, Calculator, Calendar } from 'lucide-react';
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
    processedBy: member.id
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [startDateOption, setStartDateOption] = useState<'from_end' | 'from_today' | 'custom'>('from_end');
  const [customStartDate, setCustomStartDate] = useState(formatInputDate(new Date()));

  // Helper function to format date for input type="date"
  function formatInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const isExpiredMembership = () => {
    if (!member.activeMembership) return true;
    const endDate = new Date(member.activeMembership.endDate);
    return endDate < new Date();
  };

  // Get the start date for calculating the new end date
  const getStartDate = (): Date => {
    if (!member.activeMembership) {
      return new Date(); // No membership, start from today
    }

    switch (startDateOption) {
      case 'from_end':
        // Always extend from the membership end date, even if expired
        return new Date(member.activeMembership.endDate);

      case 'from_today':
        return new Date();

      case 'custom':
        return new Date(customStartDate);

      default:
        return new Date();
    }
  };

  // Calculate new end date when months change or start date option changes
  const calculateNewEndDate = (): string => {
    const startDate = getStartDate();
    const newEnd = new Date(startDate);
    newEnd.setMonth(newEnd.getMonth() + formData.monthsPaid);
    return formatDate(newEnd);
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

    if (startDateOption === 'custom') {
      const selectedDate = new Date(customStartDate);
      if (isNaN(selectedDate.getTime())) {
        newErrors.customStartDate = 'Neispravan datum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    console.log(member.id);
    try {
      const response = await fetch(`/api/members/${member.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: getStartDate().toISOString()
        })
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
          {/* Start Date Selection */}
          {member.activeMembership && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">Produženje od datuma</span>
              </div>

              <div className="space-y-3">
                {/* Option 1: From membership end date */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="startDate"
                    value="from_end"
                    checked={startDateOption === 'from_end'}
                    onChange={(e) => setStartDateOption(e.target.value as 'from_end')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Od kraja trenutne članarine
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>
                        Produžava od: {formatDate(member.activeMembership.endDate)}
                      </span>
                      {isExpiredMembership() && (
                        <span className="text-orange-600 ml-1">
                          (istekla)
                        </span>
                      )}
                    </div>
                  </div>
                </label>

                {/* Option 2: From today */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="startDate"
                    value="from_today"
                    checked={startDateOption === 'from_today'}
                    onChange={(e) => setStartDateOption(e.target.value as 'from_today')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Od danas
                    </div>
                    <div className="text-sm text-gray-600">
                      Produžava od: {formatDate(new Date())}
                      {!isExpiredMembership() && (
                        <span className="text-orange-600 ml-1">
                          (gubi se {Math.ceil((new Date(member.activeMembership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dana)
                        </span>
                      )}
                    </div>
                  </div>
                </label>

                {/* Option 3: Custom date */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="startDate"
                    value="custom"
                    checked={startDateOption === 'custom'}
                    onChange={(e) => setStartDateOption(e.target.value as 'custom')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Customizovani datum
                    </div>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      disabled={startDateOption !== 'custom'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    {errors.customStartDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.customStartDate}</p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

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
                  <span className="text-gray-600">Produžava se od:</span>
                  <span className="font-medium text-purple-700">{formatDate(getStartDate())}</span>
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