// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.user.deleteMany();

  // Create Membership Plans
  console.log('📋 Creating membership plans...');
  const membershipPlans = await Promise.all([
    prisma.membershipPlan.create({
      data: {
        name: 'Basic Monthly',
        price: 29.99,
        durationMonths: 1,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Premium Monthly',
        price: 49.99,
        durationMonths: 1,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Basic Annual',
        price: 299.99,
        durationMonths: 12,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Premium Annual',
        price: 499.99,
        durationMonths: 12,
        isActive: true,
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: 'Student Plan',
        price: 19.99,
        durationMonths: 1,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${membershipPlans.length} membership plans`);

  // Create Users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@email.com',
        phone: '+1234567890',
        firstName: 'John',
        lastName: 'Doe',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@email.com',
        phone: '+1234567891',
        firstName: 'Jane',
        lastName: 'Smith',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.johnson@email.com',
        phone: '+1234567892',
        firstName: 'Mike',
        lastName: 'Johnson',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.wilson@email.com',
        phone: '+1234567893',
        firstName: 'Sarah',
        lastName: 'Wilson',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex.brown@email.com',
        phone: '+1234567894',
        firstName: 'Alex',
        lastName: 'Brown',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Memberships
  console.log('🏋️ Creating memberships...');
  const currentDate = new Date();
  const memberships = await Promise.all([
    // John Doe - Premium Monthly (Active)
    prisma.membership.create({
      data: {
        userId: users[0].id,
        planId: membershipPlans[1].id, // Premium Monthly
        startDate: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        endDate: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        lastPaymentDate: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000),
        nextPaymentDue: new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        notes: 'VIP member since 2023',
      },
    }),
    // Jane Smith - Basic Annual (Active)
    prisma.membership.create({
      data: {
        userId: users[1].id,
        planId: membershipPlans[2].id, // Basic Annual
        startDate: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        endDate: new Date(currentDate.getTime() + 275 * 24 * 60 * 60 * 1000), // ~9 months from now
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        lastPaymentDate: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000),
        nextPaymentDue: new Date(currentDate.getTime() + 275 * 24 * 60 * 60 * 1000),
        notes: 'Annual membership holder',
      },
    }),
    // Mike Johnson - Basic Monthly (Payment Overdue)
    prisma.membership.create({
      data: {
        userId: users[2].id,
        planId: membershipPlans[0].id, // Basic Monthly
        startDate: new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        endDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (expired)
        status: 'EXPIRED',
        paymentStatus: 'OVERDUE',
        lastPaymentDate: new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000),
        nextPaymentDue: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Needs to renew membership',
      },
    }),
    // Sarah Wilson - Student Plan (Active)
    prisma.membership.create({
      data: {
        userId: users[3].id,
        planId: membershipPlans[4].id, // Student Plan
        startDate: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        endDate: new Date(currentDate.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        lastPaymentDate: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        nextPaymentDue: new Date(currentDate.getTime() + 20 * 24 * 60 * 60 * 1000),
        notes: 'University student discount applied',
      },
    }),
    // Alex Brown - Premium Annual (Active)
    prisma.membership.create({
      data: {
        userId: users[4].id,
        planId: membershipPlans[3].id, // Premium Annual
        startDate: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(currentDate.getTime() + 335 * 24 * 60 * 60 * 1000), // ~11 months from now
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        lastPaymentDate: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        nextPaymentDue: new Date(currentDate.getTime() + 335 * 24 * 60 * 60 * 1000),
        notes: 'Corporate membership',
      },
    }),
  ]);

  console.log(`✅ Created ${memberships.length} memberships`);

  // Create Payments
  console.log('💳 Creating payments...');
  const payments = await Promise.all([
    // John's payment
    prisma.payment.create({
      data: {
        membershipId: memberships[0].id,
        userId: users[0].id,
        amount: 49.99,
        paymentDate: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000),
        paymentMethod: 'credit_card',
        monthsPaid: 1,
        notes: 'Monthly premium payment',
        processedBy: 'admin',
      },
    }),
    // Jane's annual payment
    prisma.payment.create({
      data: {
        membershipId: memberships[1].id,
        userId: users[1].id,
        amount: 299.99,
        paymentDate: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000),
        paymentMethod: 'bank_transfer',
        monthsPaid: 12,
        notes: 'Annual basic membership payment',
        processedBy: 'admin',
      },
    }),
    // Mike's last payment (before becoming overdue)
    prisma.payment.create({
      data: {
        membershipId: memberships[2].id,
        userId: users[2].id,
        amount: 29.99,
        paymentDate: new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000),
        paymentMethod: 'cash',
        monthsPaid: 1,
        notes: 'Last payment before expiration',
        processedBy: 'admin',
      },
    }),
    // Sarah's student payment
    prisma.payment.create({
      data: {
        membershipId: memberships[3].id,
        userId: users[3].id,
        amount: 19.99,
        paymentDate: new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        paymentMethod: 'debit_card',
        monthsPaid: 1,
        notes: 'Student discount applied',
        processedBy: 'admin',
      },
    }),
    // Alex's annual premium payment
    prisma.payment.create({
      data: {
        membershipId: memberships[4].id,
        userId: users[4].id,
        amount: 499.99,
        paymentDate: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        paymentMethod: 'corporate_account',
        monthsPaid: 12,
        notes: 'Corporate annual premium payment',
        processedBy: 'admin',
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // Create Notifications
  console.log('🔔 Creating notifications...');
  const notifications = await Promise.all([
    // John's upcoming payment reminder
    prisma.notification.create({
      data: {
        userId: users[0].id,
        title: 'Payment Due Soon',
        message: 'Your premium membership payment is due in 5 days.',
        type: 'PAYMENT_REMINDER',
        isSent: false,
        scheduledFor: new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      },
    }),
    // Mike's expired membership notification
    prisma.notification.create({
      data: {
        userId: users[2].id,
        title: 'Membership Expired',
        message: 'Your membership has expired. Please renew to continue access.',
        type: 'MEMBERSHIP_EXPIRED',
        isSent: true,
        scheduledFor: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        sentAt: new Date(currentDate.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    // Sarah's membership expiring soon
    prisma.notification.create({
      data: {
        userId: users[3].id,
        title: 'Membership Expiring Soon',
        message: 'Your student membership expires in 7 days. Renew now to avoid interruption.',
        type: 'MEMBERSHIP_EXPIRING',
        isSent: false,
        scheduledFor: new Date(currentDate.getTime() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
      },
    }),
    // Jane's annual renewal reminder
    prisma.notification.create({
      data: {
        userId: users[1].id,
        title: 'Annual Renewal Reminder',
        message: 'Your annual membership will expire in 30 days. Consider renewing early for discounts.',
        type: 'MEMBERSHIP_EXPIRING',
        isSent: false,
        scheduledFor: new Date(currentDate.getTime() + 245 * 24 * 60 * 60 * 1000), // ~8 months from now
      },
    }),
  ]);

  console.log(`✅ Created ${notifications.length} notifications`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });