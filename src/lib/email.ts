import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import type { Newsletter } from '@prisma/client';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type WelcomeEmailData = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    qrCode: string;
  };
  membership: {
    startDate: Date;
    endDate: Date;
    planId: string;
  };
  loginCredentials: {
    email: string;
    password: string;
  };
  membershipPlan?: {
    name: string;
    price: number;
  };
};

export async function sendNewsletterEmails(newsletterId: string): Promise<void> {
  try {
    const sendTest = process.env.SEND_TEST === 'sendTest';

    // Fetch users
    const users = await prisma.user.findMany({
      where: {
        subscribeToNotifications: true,
        role: { not: 'ADMIN' }
      },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    console.log("UKUPNO KORISNIKA KOJIMA SE SALJE MEJL", users);

    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId }
    });

    if (!newsletter) {
      console.error('Newsletter not found');
      return;
    }

    console.log(`Sending newsletter "${newsletter.title}" to ${users.length} recipients`);

    // IN DEVELOPMENT: Only send to YOUR verified Resend email
    if (sendTest) {
      const testEmail = process.env.RESEND_TEST_EMAIL; // Your Resend account email

      if (!testEmail) {
        console.error('RESEND_TEST_EMAIL not set in .env');
        return;
      }

      console.log('🧪 DEVELOPMENT MODE: Sending test email to', testEmail);

      const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: testEmail,
        subject: `[TEST] ${newsletter.title}`,
        html: generateEmailTemplate(newsletter, users[0]) // Use first user's data
      });

      if (result.error) {
        console.error('Failed to send test email:', result.error);
      } else {
        console.log('✅ Test email sent successfully');
      }

      return;
    }

    // PRODUCTION: Send to all users (requires verified domain)
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < users.length; i += chunkSize) {
      chunks.push(users.slice(i, i + chunkSize));
    }

    let totalSuccessful = 0;
    let totalFailed = 0;

    for (const chunk of chunks) {
      try {
        const emailsToSend = chunk.map(user => ({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: newsletter.title,
          html: generateEmailTemplate(newsletter, user)
        }));

        const result = await resend.batch.send(emailsToSend);

        if (result.data) {
          totalSuccessful += result.data.length;
          console.log(`Batch sent successfully: ${result.data.length} emails`);
        }

        if (result.error) {
          console.error('Batch sending error:', result.error);
          totalFailed += chunk.length;
        }
      } catch (error) {
        console.error('Failed to send batch:', error);
        totalFailed += chunk.length;
      }
    }

    console.log(`Email sending completed: ${totalSuccessful} successful, ${totalFailed} failed`);

  } catch (error) {
    console.error('Error sending newsletter emails:', error);
    throw error;
  }
}

export function generateEmailTemplate(newsletter: Newsletter, user: EmailUser): string {
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const startDateFormatted = formatDate(newsletter.startDate);
  const endDateFormatted = formatDate(newsletter.endDate);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${newsletter.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto;">
            
            <!-- Simple Header -->
            <div style="margin-bottom: 30px;">
                <h2 style="color: #2563eb; font-size: 20px; font-weight: 600; margin: 0 0 5px 0;">
                    ${newsletter.title}
                </h2>
                ${startDateFormatted && endDateFormatted ? `
                <p style="color: #666666; font-size: 14px; margin: 0;">
                    ${startDateFormatted} - ${endDateFormatted}
                </p>
                ` : ''}
            </div>
            
            <!-- Personal Greeting -->
            <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 15px 0;">
                Zdravo ${user.firstName},
            </p>
            
            <!-- Message Content -->
            <div style="font-size: 16px; line-height: 1.7; color: #333333; margin-bottom: 25px; white-space: pre-wrap;">
${newsletter.message}
            </div>
            
            <!-- Priority Note (subtle) -->
            ${newsletter.priority === 'HIGH' ? `
            <p style="font-size: 15px; color: #dc2626; margin: 20px 0; font-weight: 600;">
                ⚠️ Ovo je važno obaveštenje.
            </p>
            ` : newsletter.priority === 'MEDIUM' ? `
            <p style="font-size: 15px; color: #ea580c; margin: 20px 0;">
                Napomena: Molimo vas da obratite pažnju na ovu informaciju.
            </p>
            ` : ''}
            
            <!-- Closing -->
            <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 30px 0 10px 0;">
                Ako imate bilo kakvih pitanja, slobodno nas kontaktirajte.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333333; margin: 0;">
                Pozdrav,<br>
                <strong>Tim teretane</strong>
            </p>
            
            <!-- Simple Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 10px 0;">
                    <strong>Kontakt:</strong><br>
                    📞 +381 XX XXX XXXX<br>
                    ✉️ info@vasateretana.rs
                </p>
                
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0;">
                    <strong>Radno vreme:</strong><br>
                    Pon-Pet: 06:00-23:00<br>
                    Sub-Ned: 08:00-22:00
                </p>
                
                <p style="font-size: 12px; color: #9ca3af; margin: 20px 0 0 0;">
                    © ${new Date().getFullYear()} Vaša Teretana
                </p>
            </div>
            
        </div>
    </body>
    </html>
  `;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const htmlContent = generateWelcomeEmailTemplate(data);

    // Generate QR code as base64
    const qrCodeDataUrl = await QRCode.toDataURL(data.user.qrCode, {
      errorCorrectionLevel: 'H',
      width: 300
    });

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: data.user.email,
      subject: "Članstvo u teretani.",
      html: htmlContent,
      attachments: [{
        filename: `qr-code-${data.user.firstName}-${data.user.lastName}.png`,
        content: qrCodeDataUrl.split('base64,')[1],
      }]
    });

    if (result.error) {
      console.error('Failed to send welcome email:', result.error);
      return false;
    }

    console.log('Welcome email sent successfully:', result.data);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

function generateWelcomeEmailTemplate(data: WelcomeEmailData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const startDateFormatted = formatDate(data.membership.startDate);
  const endDateFormatted = formatDate(data.membership.endDate);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Dobrodošli u teretanu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #10b981; padding: 40px 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">
                                    Dobrodošli u teretanu!
                                </h1>
                                <p style="color: #ffffff; margin: 0; font-size: 16px; opacity: 0.9;">
                                    Vaš nalog je uspešno kreiran
                                </p>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                
                                <!-- Greeting -->
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                    Poštovani/a <strong>${data.user.firstName} ${data.user.lastName}</strong>,
                                </p>
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Vaš nalog je kreiran i možete početi da koristite našu teretanu. Ispod su vaši pristupni podaci.
                                </p>

                                <!-- Login Credentials -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">
                                                Pristupni podaci
                                            </h3>
                                            <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #ffffff; border-radius: 6px;">
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; padding: 12px;">Email:</td>
                                                    <td style="color: #333333; font-size: 14px; font-weight: bold; padding: 12px;">
                                                        ${data.loginCredentials.email}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; padding: 12px; border-top: 1px solid #f3f4f6;">Šifra:</td>
                                                    <td style="color: #dc2626; font-size: 16px; font-weight: bold; padding: 12px; border-top: 1px solid #f3f4f6; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                                                        ${data.loginCredentials.password}
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="color: #dc2626; font-size: 13px; margin: 15px 0 0 0; font-weight: 600;">
                                                ⚠️ Preporučujemo da promenite šifru nakon prvog prijavljivanja.
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Membership Info -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">
                                                Članarina
                                            </h3>
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">Početak:</td>
                                                    <td style="color: #333333; font-size: 14px; font-weight: bold; padding: 8px 0; text-align: right;">
                                                        ${startDateFormatted}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; padding: 8px 0; border-top: 1px solid #e5e7eb;">Kraj:</td>
                                                    <td style="color: #333333; font-size: 14px; font-weight: bold; padding: 8px 0; text-align: right; border-top: 1px solid #e5e7eb;">
                                                        ${endDateFormatted}
                                                    </td>
                                                </tr>
                                                ${data.membershipPlan ? `
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; padding: 8px 0; border-top: 1px solid #e5e7eb;">Plan:</td>
                                                    <td style="color: #333333; font-size: 14px; font-weight: bold; padding: 8px 0; text-align: right; border-top: 1px solid #e5e7eb;">
                                                        ${data.membershipPlan.name}
                                                    </td>
                                                </tr>
                                                ` : ''}
                                                <tr>
                                                    <td colspan="2" style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                                        <span style="background-color: #d1fae5; color: #059669; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">
                                                            ✓ AKTIVNO
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- QR Code Info -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 20px; text-align: center;">
                                            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
                                                QR Kod za ulaz
                                            </h3>
                                            <p style="color: #475569; font-size: 14px; margin: 0 0 15px 0;">
                                                Vaš jedinstveni QR kod se nalazi u prilogu ovog email-a. Pokažite ga na ulazu u teretanu.
                                            </p>
                                            <p style="color: #64748b; font-size: 13px; margin: 0; font-style: italic;">
                                                📎 Proverite prilog (attachment) email-a
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Login Button -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                    <tr>
                                        <td align="center">
                                            <a href="${appUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                                Prijavite se
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Support -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                                    <tr>
                                        <td style="text-align: center;">
                                            <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                                                Potrebna vam je pomoć?
                                            </p>
                                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                                Kontaktirajte nas na: <a href="mailto:info@vasateretana.rs" style="color: #10b981; text-decoration: none;">info@vasateretana.rs</a>
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #1f2937; padding: 20px 30px; text-align: center;">
                                <p style="color: #9ca3af; font-size: 13px; margin: 0 0 5px 0;">
                                    Pon-Pet: 06:00-23:00 | Sub-Ned: 08:00-22:00
                                </p>
                                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                    © ${new Date().getFullYear()} Vaša Teretana. Sva prava zadržana.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    // Resend doesn't have a verify method, but we can test with a simple API call
    // You could optionally make a test API call here if needed
    console.log('Resend API key configured');
    return true;
  } catch (error) {
    console.error('Resend configuration failed:', error);
    return false;
  }
}

export async function sendSingleEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to,
      subject,
      html: htmlContent
    });

    if (result.error) {
      console.error(`Failed to send email to ${to}:`, result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}