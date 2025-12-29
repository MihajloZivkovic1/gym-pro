import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import type { Newsletter } from '@prisma/client';
import QRCode from 'qrcode';


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

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtpout.secureserver.net",
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "podelitrenutak@podelitrenutak.com",
    pass: process.env.SMTP_PASS
  },
  logger: true,
  debug: true
});

export async function sendNewsletterEmails(newsletterId: string): Promise<void> {
  try {
    // Fetch only non-admin users who are subscribed to notifications
    const users = await prisma.user.findMany({
      where: {
        subscribeToNotifications: true,
        role: {
          not: 'ADMIN' // Exclude admins from newsletters
        }
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

    const emailPromises = users.map(user =>
      transporter.sendMail({
        from: process.env.SMTP_USER || "podelitrenutak@podelitrenutak.com",
        to: user.email,
        subject: newsletter.title,
        html: generateEmailTemplate(newsletter, user)
      }).catch(error => {
        console.error(`Failed to send email to ${user.email}:`, error);
        return null; // Continue with other emails even if one fails
      })
    );

    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`Email sending completed: ${successful} successful, ${failed} failed`);

    // Create notifications only for non-admin users
    const notificationPromises = users.map(user =>
      prisma.notification.create({
        data: {
          userId: user.id,
          title: newsletter.title,
          message: newsletter.message,
          type: 'MEMBERSHIP_EXPIRED',
          isSent: true,
          scheduledFor: new Date(),
          sentAt: new Date()
        }
      }).catch(error => {
        console.error(`Failed to create notification for user ${user.id}:`, error);
        return null;
      })
    );

    await Promise.allSettled(notificationPromises);

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
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header with Gym Branding -->
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%); color: white; padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.5;"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
                
                <div style="position: relative; z-index: 2;">
                    <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                        💪 VAŠA TERETANA
                    </h1>
                    <p style="margin: 0; font-size: 18px; opacity: 0.9; font-weight: 500;">
                        Vaš put do boljih rezultata
                    </p>
                </div>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
                <!-- Title Section -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">
                        ${newsletter.title}
                    </h2>
                    <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #3b82f6, #06b6d4); margin: 0 auto; border-radius: 2px;"></div>
                </div>
                
                <!-- Personal Greeting -->
                <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 25px; border-radius: 12px; border-left: 5px solid #3b82f6; margin-bottom: 30px;">
                    <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                        Zdravo ${user.firstName}!
                    </p>
                    <p style="margin: 10px 0 0 0; color: #475569; font-size: 16px; line-height: 1.5;">
                        Imamo važne informacije za tebe kao člana naše teretane.
                    </p>
                </div>
                
                <!-- Message Content -->
                <div style="background: #ffffff; padding: 30px; border-radius: 12px; border: 2px solid #e2e8f0; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="color: #334155; font-size: 16px; line-height: 1.7;">
                        ${newsletter.message}
                    </div>
                </div>
                
                <!-- Date Range (if applicable) -->
                ${startDateFormatted && endDateFormatted ? `
                    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f59e0b; text-align: center;">
                        <p style="margin: 8px 0 0 0; color: #92400e; font-weight: 600; font-size: 15px;">
                            ${startDateFormatted} - ${endDateFormatted}
                        </p>
                    </div>
                ` : ''}
                
                <!-- Priority Badge -->
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; padding: 12px 24px; border-radius: 25px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${newsletter.priority === 'HIGH'
      ? 'background: linear-gradient(135deg, #dc2626, #ef4444); color: white; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);'
      : newsletter.priority === 'MEDIUM'
        ? 'background: linear-gradient(135deg, #d97706, #f59e0b); color: white; box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3);'
        : 'background: linear-gradient(135deg, #059669, #10b981); color: white; box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);'
    }">
                        ${newsletter.priority === 'HIGH' ? '🚨 HITNO OBAVEŠTENJE' :
      newsletter.priority === 'MEDIUM' ? '⚠️ VAŽNO OBAVEŠTENJE' :
        '✅ INFORMACIJA'}
                    </span>
                </div>
                
                <!-- Call to Action -->
                <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
                    <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">
                        Pitanja? Kontaktirajte naš tim!
                    </p>
                    <p style="margin: 10px 0 0 0; color: #bfdbfe; font-size: 14px;">
                        Uvek smo tu da vam pomognemo u ostvarivanju vaših ciljeva
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #1e293b; padding: 30px; text-align: center;">
                <!-- Contact Info -->
                <div style="margin-bottom: 25px;">
                    <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                        KONTAKT INFORMACIJE
                    </p>
                    <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">
                        📍 Adresa: Vaša adresa ovde
                    </p>
                    <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">
                        📞 Telefon: +381 XX XXX XXXX
                    </p>
                    <p style="color: #cbd5e1; font-size: 14px; margin: 5px 0;">
                        ✉️ Email: info@vasateretana.rs
                    </p>
                </div>
                
                <!-- Working Hours -->
                <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">
                        RADNO VREME
                    </p>
                    <p style="color: #cbd5e1; font-size: 13px; margin: 3px 0;">
                        Ponedeljak - Petak: 06:00 - 23:00
                    </p>
                    <p style="color: #cbd5e1; font-size: 13px; margin: 3px 0;">
                        Subota - Nedelja: 08:00 - 22:00
                    </p>
                </div>
                
                <!-- Motivational Message -->
                <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                    <p style="color: #3b82f6; font-size: 15px; margin: 0 0 10px 0; font-weight: 600; font-style: italic;">
                        "Svaki trening se broji!"
                    </p>
                    <p style="color: #64748b; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Vaša Teretana. Sva prava zadržana.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}


export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const htmlContent = generateWelcomeEmailTemplate(data);

    const qrCodeDataUrl = await QRCode.toDataURL(data.user.qrCode, {
      errorCorrectionLevel: 'H',
      width: 300
    });

    const qrCodeBase64 = qrCodeDataUrl.split('base64,')[1];

    await transporter.sendMail({
      from: process.env.SMTP_USER || "podelitrenutak@podelitrenutak.com",
      to: data.user.email,
      subject: "Članstvo u teretani.",
      html: htmlContent,
      attachments: [{
        filename: `qr-code-${data.user.firstName}-${data.user.lastName}.png`,
        content: qrCodeBase64,
        encoding: 'base64'
      }]
    });

    return true;
  } catch (error) {
    console.error(error);
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
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}

export async function sendSingleEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "podelitrenutak@podelitrenutak.com",
      to,
      subject,
      html: htmlContent
    });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}