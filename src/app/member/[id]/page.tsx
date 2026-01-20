import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calculateMembershipStatus } from '@/lib/utils';
import { MemberProfileHeader } from '@/components/members/MemberProfileHeader';
import { MembershipStatus } from '@/components/members/MembershipStatus';
import { MembershipHistory } from '@/components/members/MembershipHistory';
import { PaymentHistory } from '@/components/members/PaymentHistory';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

async function getMemberData(id: string) {
  try {
    const member = await prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            plan: true,
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          include: {
            membership: {
              include: { plan: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!member) {
      return null;
    }

    // Add computed fields
    const activeMembership = member.memberships.find(m => m.status === 'ACTIVE');
    const membershipStatus = activeMembership
      ? calculateMembershipStatus(activeMembership.endDate.toISOString())
      : 'expired';

    // Calculate stats
    const totalPayments = member.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalCheckIns = 0; // Will add this later when we implement check-ins

    // Transform data to match component expectations
    const transformedMember = {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || undefined, // Convert null to undefined
      createdAt: member.createdAt,
      membershipStatus,
      qrCode: member.qrCode || undefined,
      activeMembership: activeMembership ? {
        id: activeMembership.id,
        startDate: activeMembership.startDate,
        endDate: activeMembership.endDate,
        status: activeMembership.status,
        paymentStatus: activeMembership.paymentStatus,
        lastPaymentDate: activeMembership.lastPaymentDate || undefined, // Convert null to undefined
        plan: {
          name: activeMembership.plan.name,
          price: Number(activeMembership.plan.price), // Convert Decimal to number
          durationMonths: activeMembership.plan.durationMonths
        }
      } : undefined,
      stats: {
        totalPayments,
        totalCheckIns,
        memberSince: member.createdAt,
        totalMemberships: member.memberships.length
      },
      role: member.role
    };

    // Transform memberships for MembershipHistory
    const transformedMemberships = member.memberships.map(membership => ({
      id: membership.id,
      startDate: membership.startDate,
      endDate: membership.endDate,
      status: membership.status,
      paymentStatus: membership.paymentStatus,
      plan: {
        name: membership.plan.name,
        price: Number(membership.plan.price) // Convert Decimal to number
      },
      payments: membership.payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount), // Convert Decimal to number
        paymentDate: payment.paymentDate
      }))
    }));

    // Transform payments for PaymentHistory
    const transformedPayments = member.payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount), // Convert Decimal to number
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      monthsPaid: payment.monthsPaid,
      notes: payment.notes || undefined, // Convert null to undefined
      membership: {
        plan: {
          name: payment.membership.plan.name
        }
      }
    }));

    // Transform notifications for NotificationHistory
    const transformedNotifications = member.notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type as string, // Convert enum to string
      isSent: notification.isSent,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt || undefined, // Convert null to undefined
      createdAt: notification.createdAt
    }));

    return {
      member: transformedMember,
      memberships: transformedMemberships,
      payments: transformedPayments,
      notifications: transformedNotifications
    };
  } catch (error) {
    console.error('Error fetching member data:', error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const data = await getMemberData(id);
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }


  const currentUserId = session.user.id;
  const currentUserRole = session.user.role;

  if (currentUserRole !== 'ADMIN' && currentUserId !== id) {
    redirect('/unauthorized'); // or redirect('/member/' + currentUserId)
  }
  if (!data) {
    notFound();
  }
  const { member, memberships, payments, notifications } = data;

  return (
    <div className="space-y-6">
      {/* Member Header */}
      <MemberProfileHeader member={member} />

      {/* Current Membership Status */}
      <MembershipStatus member={member} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership History */}
        <MembershipHistory memberships={memberships} />

        {/* Payment History */}
        <PaymentHistory payments={payments} />
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await getMemberData(id);

  if (!data) {
    return {
      title: 'Member Not Found - GymPro'
    };
  }

  return {
    title: `${data.member.firstName} ${data.member.lastName} - GymPro`,
    description: `Member profile for ${data.member.firstName} ${data.member.lastName}`
  };
}