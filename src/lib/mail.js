import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    console.log('Mail Config:', {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER
    });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Touches D'Art" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('Nodemailer Error Details:', error);
        throw error;
    }
};

export const sendInterviewCodeEmail = async ({ to, firstName, lastName, code, interviewDate }) => {
    const dateObj = new Date(interviewDate);

    const formattedDateFR = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' à ' + dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const formattedDateAR = dateObj.toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' الساعة ' + dateObj.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });
    const formattedDateEN = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' at ' + dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 13px; }
    .code-box { background: rgba(124, 58, 237, 0.15); border: 2px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 20px; }
    .code { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #a78bfa; margin: 8px 0; }
    .section { padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .lang-title { font-size: 16px; font-weight: 700; color: #38bdf8; margin-bottom: 10px; }
    .info-row { margin: 8px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .warning-box { background: rgba(244, 63, 94, 0.15); border-left: 4px solid #f43f5e; padding: 12px 16px; border-radius: 8px; margin-top: 12px; font-size: 13.5px; color: #fecdd3; line-height: 1.5; }
    .warning-box-rtl { background: rgba(244, 63, 94, 0.15); border-right: 4px solid #f43f5e; padding: 12px 16px; border-radius: 8px; margin-top: 12px; font-size: 13.5px; color: #fecdd3; line-height: 1.5; text-align: right; }
    .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Association Touches d'Art</h1>
      <p>Confirmation de Demande d'Entretien | تأكيد طلب المقابلة | Interview Confirmation</p>
    </div>

    <div class="code-box">
      <div style="font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">CODE ROOM ENTRETIEN | رمز غرفة المقابلة | INTERVIEW ROOM CODE</div>
      <div class="code">${code}</div>
      <div style="font-size: 13px; color: #cbd5e1;">Conservez ce code précieusement | احفظ هذا الرمز جيداً | Keep this code safe</div>
    </div>

    <!-- Section Français -->
    <div class="section">
      <div class="lang-title">🇫🇷 Français</div>
      <div class="info-row">Bonjour <strong>${firstName} ${lastName}</strong>,</div>
      <div class="info-row">Votre demande d'entretien a été enregistrée avec succès. Voici les détails de votre rendez-vous :</div>
      <div class="info-row">📅 <strong>Date & Heure de l'entretien :</strong> ${formattedDateFR}</div>
      <div class="warning-box">
        ⚠️ <strong>Remarque importante sur le retard :</strong><br>
        Vous disposez d'un délai maximum de retard autorisé de <strong>15 minutes</strong> après l'heure prévue. 
        Au-delà de ces 15 minutes de retard, votre code d'accès deviendra automatiquement <strong>invalide et inutilisable</strong>.
      </div>
    </div>

    <!-- Section Arabe -->
    <div class="section" dir="rtl" style="text-align: right;">
      <div class="lang-title" style="text-align: right;">🇹🇳 العربية</div>
      <div class="info-row">مرحباً <strong>${firstName} ${lastName}</strong>،</div>
      <div class="info-row">تم تسجيل طلب المقابلة الخاص بك بنجاح. تفاصيل الموعد:</div>
      <div class="info-row">📅 <strong>تاريخ ووقت المقابلة:</strong> ${formattedDateAR}</div>
      <div class="warning-box-rtl">
        ⚠️ <strong>ملاحظة هامة حول التأخير:</strong><br>
        يُسمح بتأخير أقصاه <strong>15 دقيقة</strong> فقط عن الموعد المحدد. 
        بعد انقضاء 15 دقيقة تأخير، ينتهي الرمز تلقائياً وسيصبح <strong>غير صالـح للاستخدام</strong>.
      </div>
    </div>

    <!-- Section English -->
    <div class="section">
      <div class="lang-title">🇬🇧 English</div>
      <div class="info-row">Hello <strong>${firstName} ${lastName}</strong>,</div>
      <div class="info-row">Your interview request has been successfully registered. Appointment details:</div>
      <div class="info-row">📅 <strong>Interview Date & Time:</strong> ${formattedDateEN}</div>
      <div class="warning-box">
        ⚠️ <strong>Important Note on Delay:</strong><br>
        You have a maximum allowed delay of <strong>15 minutes</strong> after the scheduled time. 
        After this 15-minute grace period, your access code will automatically become <strong>invalid and unusable</strong>.
      </div>
    </div>

    <div class="footer">
      Association Touches d'Art &copy; ${new Date().getFullYear()} — Tous droits réservés.
    </div>
  </div>
</body>
</html>
    `;

    return sendEmail({
        to,
        subject: `Touches d'Art - Code de salle d'entretien / رمز غرفة المقابلة / Interview Code: ${code}`,
        html
    });
};
