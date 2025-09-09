'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface PaymentButtonProps {
  member: any;
  onPaymentSuccess?: () => void;
  variant?: 'primary' | 'secondary' | 'small';
  className?: string;
}

export function PaymentButton({
  member,
  onPaymentSuccess,
  variant = 'primary',
  className = ''
}: PaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handlePaymentSuccess = (paymentData: any) => {
    const monthsPaid = paymentData.data?.monthsAdded || 1;
    const newEndDate = paymentData.data?.newEndDate;

    // Different messages for expired vs active memberships
    const isExpiredMembership = member.membershipStatus === 'expired';
    const successMessage = isExpiredMembership
      ? `✅ Članarina reaktivirana!\n\nNova članarina: ${monthsPaid} mesec${monthsPaid > 1 ? 'i' : ''}\n${newEndDate ? `Važi do: ${new Date(newEndDate).toLocaleDateString('sr-RS')}` : ''}`
      : `✅ Plaćanje uspešno!\n\nČlanarina produžena za ${monthsPaid} mesec${monthsPaid > 1 ? 'i' : ''}\n${newEndDate ? `Nova važi do: ${new Date(newEndDate).toLocaleDateString('sr-RS')}` : ''}`;

    alert(successMessage);

    if (onPaymentSuccess) onPaymentSuccess();
    setShowModal(false);
  };

  const getButtonStyles = () => {
    const isExpired = member.membershipStatus === 'expired';

    switch (variant) {
      case 'primary':
        return isExpired
          ? "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          : "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors";
      case 'secondary':
        return isExpired
          ? "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors";
      case 'small':
        return isExpired
          ? "bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
          : "bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors";
      default:
        return isExpired
          ? "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          : "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors";
    }
  };

  const getIconSize = () => {
    return variant === 'small' ? "w-3 h-3" : "w-4 h-4";
  };

  const getButtonText = () => {
    const isExpired = member.membershipStatus === 'expired';

    switch (variant) {
      case 'small':
        return isExpired ? 'Reaktiviraj' : 'Plati';
      case 'secondary':
        return isExpired ? 'Reaktiviraj članarinu' : 'Naplati članarinu';
      default:
        return isExpired ? 'Reaktiviraj članarinu' : 'Naplati članarinu';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${getButtonStyles()} ${className}`}
      >
        <CreditCard className={getIconSize()} />
        {getButtonText()}
      </button>

      {showModal && (
        <PaymentModal
          member={member}
          onClose={() => setShowModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}