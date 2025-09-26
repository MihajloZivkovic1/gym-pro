'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  memberships: Array<{
    id: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
    startDate: string;
    endDate: string;
    lastPaymentDate: string | null;
    nextPaymentDue: string | null;
    notes: string | null;
    plan: {
      name: string;
      price: number;
      durationMonths: number;
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    monthsPaid: number;
    notes: string | null;
    processedBy: string | null;
    createdAt: string;
    membership: {
      plan: {
        name: string;
      };
    };
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'MEMBERSHIP_EXPIRING' | 'MEMBERSHIP_EXPIRED' | 'PAYMENT_REMINDER';
    isSent: boolean;
    scheduledFor: string;
    sentAt: string | null;
  }>;
  activeMembership: any;
  totalPaid: number;
  paymentCount: number;
  membershipStatus: string;
}

export function ExportCard() {
  const [isExporting, setIsExporting] = useState(false);

  const fetchExportData = async (): Promise<Member[]> => {
    try {
      console.log('Fetching export data from /api/members/export');

      const response = await fetch('/api/members/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched data:', data);

      if (!Array.isArray(data)) {
        throw new Error('Expected array of members, received: ' + typeof data);
      }

      return data;
    } catch (error) {
      console.error('Error fetching export data:', error);
      throw error;
    }
  };

  const calculateStatistics = (members: Member[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Basic counts
    const totalMembers = members.length;
    const activeMembers = members.filter(member =>
      member.memberships.some(m => m.status === 'ACTIVE')
    ).length;

    // Revenue calculations - all payments are valid since there's no status field
    const allPayments = members.flatMap(member => member.payments);
    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const thisYearPayments = allPayments.filter(payment =>
      new Date(payment.paymentDate).getFullYear() === currentYear
    );
    const yearlyRevenue = thisYearPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const thisMonthPayments = allPayments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth;
    });
    const monthlyRevenue = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Average revenue per member
    const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0;

    // Membership plan distribution
    const planDistribution: { [key: string]: number } = {};
    members.forEach(member => {
      const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');
      if (activeMembership) {
        const planName = activeMembership.plan.name;
        planDistribution[planName] = (planDistribution[planName] || 0) + 1;
      }
    });

    // Payment status distribution
    const paymentStatusDistribution: { [key: string]: number } = {};
    members.forEach(member => {
      const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');
      if (activeMembership) {
        const status = activeMembership.paymentStatus;
        paymentStatusDistribution[status] = (paymentStatusDistribution[status] || 0) + 1;
      }
    });

    // Monthly revenue trend (last 12 months)
    const monthlyTrend: { [key: string]: number } = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getFullYear() === date.getFullYear() &&
          paymentDate.getMonth() === date.getMonth();
      });

      monthlyTrend[monthKey] = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    // Payment method distribution
    const paymentMethodDistribution: { [key: string]: number } = {};
    allPayments.forEach(payment => {
      const method = payment.paymentMethod;
      paymentMethodDistribution[method] = (paymentMethodDistribution[method] || 0) + 1;
    });

    return {
      totalMembers,
      activeMembers,
      inactiveMembers: totalMembers - activeMembers,
      totalRevenue,
      yearlyRevenue,
      monthlyRevenue,
      avgRevenuePerMember,
      planDistribution,
      paymentStatusDistribution,
      paymentMethodDistribution,
      monthlyTrend,
      totalPayments: allPayments.length,
      avgPaymentAmount: allPayments.length > 0 ? totalRevenue / allPayments.length : 0,
      avgMonthsPaidPerPayment: allPayments.length > 0
        ? allPayments.reduce((sum, p) => sum + p.monthsPaid, 0) / allPayments.length
        : 0
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  };

  const formatPaymentStatus = (status: string) => {
    const statusMap = {
      'PAID': 'Plaćeno',
      'PENDING': 'Na čekanju',
      'OVERDUE': 'Zakašnjeno',
      'PARTIAL': 'Delimično'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatMembershipStatus = (status: string) => {
    const statusMap = {
      'ACTIVE': 'Aktivno',
      'EXPIRED': 'Isteklo',
      'CANCELLED': 'Otkazano'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const exportToExcel = async () => {
    if (isExporting) return; // Prevent double clicks

    setIsExporting(true);

    try {
      console.log('Starting export process...');

      const members: Member[] = await fetchExportData();
      console.log(`Fetched ${members.length} members`);

      if (members.length === 0) {
        alert('Nema podataka za izvoz.');
        return;
      }

      const statistics = calculateStatistics(members);
      console.log('Calculated statistics:', statistics);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Member Data
      const memberData = members.map(member => {
        const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');

        return {
          'ID': member.id,
          'Ime': member.firstName,
          'Prezime': member.lastName,
          'Email': member.email,
          'Telefon': member.phone || '',
          'Datum registracije': new Date(member.createdAt).toLocaleDateString('sr-RS'),
          'Poslednje ažuriranje': new Date(member.updatedAt).toLocaleDateString('sr-RS'),
          'Trenutni plan': activeMembership ? activeMembership.plan.name : 'Nema',
          'Status članstva': activeMembership ? formatMembershipStatus(activeMembership.status) : 'Neaktivan',
          'Status plaćanja': activeMembership ? formatPaymentStatus(activeMembership.paymentStatus) : '',
          'Datum početka': activeMembership ? new Date(activeMembership.startDate).toLocaleDateString('sr-RS') : '',
          'Datum isteka': activeMembership ? new Date(activeMembership.endDate).toLocaleDateString('sr-RS') : '',
          'Poslednje plaćanje': activeMembership?.lastPaymentDate ? new Date(activeMembership.lastPaymentDate).toLocaleDateString('sr-RS') : '',
          'Sledeće plaćanje': activeMembership?.nextPaymentDue ? new Date(activeMembership.nextPaymentDue).toLocaleDateString('sr-RS') : '',
          'Ukupno plaćeno': formatCurrency(member.totalPaid),
          'Broj plaćanja': member.paymentCount,
          'Prosečno po plaćanju': member.paymentCount > 0 ? formatCurrency(member.totalPaid / member.paymentCount) : '0'
        };
      });

      const memberSheet = XLSX.utils.json_to_sheet(memberData);
      XLSX.utils.book_append_sheet(workbook, memberSheet, 'Članovi');

      // Sheet 2: Statistics Overview
      const statsData = [
        { 'Statistika': 'Ukupno članova', 'Vrednost': statistics.totalMembers },
        { 'Statistika': 'Aktivni članovi', 'Vrednost': statistics.activeMembers },
        { 'Statistika': 'Neaktivni članovi', 'Vrednost': statistics.inactiveMembers },
        { 'Statistika': 'Ukupan prihod', 'Vrednost': formatCurrency(statistics.totalRevenue) },
        { 'Statistika': 'Prihod ove godine', 'Vrednost': formatCurrency(statistics.yearlyRevenue) },
        { 'Statistika': 'Prihod ovog meseca', 'Vrednost': formatCurrency(statistics.monthlyRevenue) },
        { 'Statistika': 'Prosečan prihod po članu', 'Vrednost': formatCurrency(statistics.avgRevenuePerMember) },
        { 'Statistika': 'Ukupno plaćanja', 'Vrednost': statistics.totalPayments },
        { 'Statistika': 'Prosečno plaćanje', 'Vrednost': formatCurrency(statistics.avgPaymentAmount) },
        { 'Statistika': 'Prosečno meseci po plaćanju', 'Vrednost': statistics.avgMonthsPaidPerPayment.toFixed(1) }
      ];

      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistike');

      // Sheet 3: Plan Distribution
      const planData = Object.entries(statistics.planDistribution).map(([plan, count]) => ({
        'Plan': plan,
        'Broj članova': count,
        'Procenat': `${((count / statistics.activeMembers) * 100).toFixed(1)}%`
      }));

      const planSheet = XLSX.utils.json_to_sheet(planData);
      XLSX.utils.book_append_sheet(workbook, planSheet, 'Distribucija planova');

      // Sheet 4: Payment Status Distribution
      const paymentStatusData = Object.entries(statistics.paymentStatusDistribution).map(([status, count]) => ({
        'Status plaćanja': formatPaymentStatus(status),
        'Broj članova': count,
        'Procenat': `${((count / statistics.activeMembers) * 100).toFixed(1)}%`
      }));

      const paymentStatusSheet = XLSX.utils.json_to_sheet(paymentStatusData);
      XLSX.utils.book_append_sheet(workbook, paymentStatusSheet, 'Status plaćanja');

      // Sheet 5: Monthly Revenue Trend
      const trendData = Object.entries(statistics.monthlyTrend).map(([month, revenue]) => ({
        'Mesec': month,
        'Prihod': formatCurrency(revenue),
        'Broj': revenue
      }));

      const trendSheet = XLSX.utils.json_to_sheet(trendData);
      XLSX.utils.book_append_sheet(workbook, trendSheet, 'Mesečni trend');

      // Sheet 6: Payment Methods
      const methodData = Object.entries(statistics.paymentMethodDistribution).map(([method, count]) => ({
        'Način plaćanja': method,
        'Broj plaćanja': count,
        'Procenat': `${((count / statistics.totalPayments) * 100).toFixed(1)}%`
      }));

      const methodSheet = XLSX.utils.json_to_sheet(methodData);
      XLSX.utils.book_append_sheet(workbook, methodSheet, 'Načini plaćanja');

      // Sheet 7: All Payments
      const allPayments = members.flatMap(member =>
        member.payments.map(payment => ({
          'Datum plaćanja': new Date(payment.paymentDate).toLocaleDateString('sr-RS'),
          'Član': `${member.firstName} ${member.lastName}`,
          'Email': member.email,
          'Plan': payment.membership.plan.name,
          'Iznos': formatCurrency(payment.amount),
          'Način plaćanja': payment.paymentMethod,
          'Meseci plaćeno': payment.monthsPaid,
          'Iznos po mesecu': formatCurrency(payment.amount / payment.monthsPaid),
          'Obrađeno od': payment.processedBy || 'N/A',
          'Napomene': payment.notes || '',
          'ID plaćanja': payment.id
        }))
      );

      // Sort by date (newest first)
      allPayments.sort((a, b) => new Date(b['Datum plaćanja']).getTime() - new Date(a['Datum plaćanja']).getTime());

      const paymentsSheet = XLSX.utils.json_to_sheet(allPayments);
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Sva plaćanja');

      // Generate file name with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `GymPro_Izvoz_${currentDate}.xlsx`;

      console.log('Writing file:', fileName);

      // Write and download file
      XLSX.writeFile(workbook, fileName);

      console.log('Export completed successfully');

    } catch (error) {
      console.error('Export error:', error);

      // More detailed error message
      let errorMessage = 'Greška pri izvozu podataka.';
      if (error instanceof Error) {
        errorMessage += ` Detalji: ${error.message}`;
      }

      alert(errorMessage + ' Proverite konzolu za više informacija.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="group block cursor-pointer">
      <div
        className={`relative bg-gray-50 rounded-2xl p-8 text-center transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 border border-gray-100 hover:border-gray-200 ${isExporting ? 'opacity-75 cursor-wait' : 'cursor-pointer'
          }`}
        onClick={exportToExcel}
      >
        <div className="w-16 h-16 mx-auto mb-6 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 transition-colors duration-300">
          {isExporting ? (
            <Loader2 className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300 animate-spin" />
          ) : (
            <FileDown className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
          )}
        </div>
        <h3 className="font-semibold text-slate-900 mb-2">Export</h3>
        <div className="mt-4">
          <div className="w-full h-12 flex items-center justify-center gap-2 text-purple-600 font-medium">
            {isExporting ? (
              <span>Download u toku...</span>
            ) : (
              <span>Skini statistiku</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}