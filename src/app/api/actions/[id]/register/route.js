import dbConnect from '@/lib/db';
import Action from '@/models/Action';
import Registration from '@/models/Registration';
import User from '@/models/User';
import Club from '@/models/Club';
import { sendEmail } from '@/lib/mail';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import crypto from 'crypto';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      firstName,
      lastName,
      birthDate,
      nationality,
      email,
      phone,
      occupation,
      customAnswers,
      userId // Optional
    } = body;

    await dbConnect();

    const action = await Action.findById(id).populate('club');
    if (!action) {
      return NextResponse.json({ error: 'Action non trouvée' }, { status: 404 });
    }

    // Check if user is member
    let isMember = false;
    let clubName = '';
    if (userId) {
      const user = await User.findById(userId).populate('club');
      if (user) {
        isMember = true;
        clubName = user.club?.name || 'Membre de l\'association';
      }
    }

    // Generate unique ticket code
    const ticketCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Save registration
    const registration = await Registration.create({
      action: id,
      user: userId || null,
      firstName,
      lastName,
      birthDate,
      nationality,
      email,
      phone,
      occupation,
      customAnswers,
      isMember,
      clubName,
      ticketCode
    });

    // Generate QR Code
    const qrData = JSON.stringify({
      ticket: ticketCode,
      name: `${firstName} ${lastName}`,
      event: action.title,
      date: action.startDate,
      isMember
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Send Email with Ticket
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 2px solid #11224E; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <div style="background-color: #11224E; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Votre Ticket d'Événement</h1>
          <p style="margin: 10px 0 0; opacity: 0.8;">Touches D'Art - Association Culturelle</p>
        </div>
        
        <div style="padding: 40px; background-color: #ffffff; position: relative;">
          <div style="margin-bottom: 30px; border-bottom: 1px dashed #ccc; padding-bottom: 20px;">
            <h2 style="color: #11224E; margin: 0 0 10px; font-size: 22px;">${action.title}</h2>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(action.startDate).toLocaleDateString('fr-FR')} à ${action.localTime}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Lieu:</strong> ${action.location || 'À définir'}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Type:</strong> ${action.type || 'Événement'}</p>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <p style="margin: 0 0 5px; color: #999; font-size: 12px; text-transform: uppercase;">Participant</p>
              <p style="margin: 0 0 20px; color: #333; font-size: 18px; font-weight: bold;">${firstName} ${lastName}</p>
              
              <p style="margin: 0 0 5px; color: #999; font-size: 12px; text-transform: uppercase;">Statut</p>
              <p style="margin: 0; color: ${isMember ? '#27ae60' : '#e67e22'}; font-weight: bold;">
                ${isMember ? `Membre (${clubName})` : 'Visiteur'}
              </p>
            </div>
            <div style="text-align: center; margin-left: 20px;">
              <img src="cid:qrcode" alt="QR Code" style="width: 120px; height: 120px; border: 1px solid #eee; padding: 5px;" />
              <p style="margin: 5px 0 0; font-family: monospace; font-weight: bold; color: #11224E;">#${ticketCode}</p>
            </div>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #777; font-size: 14px;">Veuillez présenter ce ticket (numérique ou imprimé) à l'entrée.</p>
        </div>
      </div>
    `;

    // Note: To send image as CID, we need to handle attachments in sendEmail
    // For now, I'll update sendEmail to support attachments or just use data URL if supported by mail clients (risky)
    // Better to update sendEmail.

    let emailSent = false;
    try {
      await sendEmail({
        to: email,
        subject: `Votre Ticket pour ${action.title} - Touches D'Art`,
        html: emailHtml,
        attachments: [
          {
            filename: 'qrcode.png',
            content: qrCodeDataUrl.split(',')[1],
            encoding: 'base64',
            cid: 'qrcode'
          }
        ]
      });
      emailSent = true;
    } catch (mailError) {
      console.error('Failed to send ticket email:', mailError);
    }

    return NextResponse.json({
      success: true,
      ticketCode,
      emailSent,
      message: emailSent ? 'Inscription réussie ! Un ticket a été envoyé par email.' : 'Inscription réussie, mais l\'envoi du ticket par email a échoué. Veuillez contacter l\'administrateur.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 });
  }
}
