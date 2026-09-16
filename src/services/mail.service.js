import nodemailer from 'nodemailer';
import config from '../config/config.js';

export class MailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const { host, port, user, pass } = config.mail;
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } else {
      this.transporter = null;
    }
  }

  async sendTicketConfirmationEmail({ to, user, event, ticket }) {
    const recipientEmail = to || user?.email;
    if (!recipientEmail) {
      console.warn('[MailService] No se especificó destinatario para el email.');
      return null;
    }

    const eventTitle = event?.title || 'Evento Deportivo';
    const reservationCode = ticket?.reservationCode || 'SIN_CODIGO';
    const subject = `Confirmación de Inscripción - ${eventTitle} [${reservationCode}]`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">SportEventHub</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Confirmación de Reserva</p>
        </div>
        <div style="padding: 25px;">
          <p>Hola <strong>${user?.first_name || 'Deportista'}</strong>,</p>
          <p>¡Tu inscripción ha sido confirmada con éxito! A continuación encontrarás el detalle de tu reserva:</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>Código de Reserva:</strong> <span style="font-size: 18px; color: #059669; font-weight: bold;">${reservationCode}</span></p>
            <p style="margin: 6px 0;"><strong>Evento:</strong> ${eventTitle}</p>
            <p style="margin: 6px 0;"><strong>Categoría:</strong> ${event?.category || 'General'}</p>
            <p style="margin: 6px 0;"><strong>Fecha:</strong> ${event?.date ? new Date(event.date).toLocaleDateString() : 'Por definir'}</p>
            <p style="margin: 6px 0;"><strong>Ubicación:</strong> ${event?.location || 'Por definir'}</p>
            <p style="margin: 6px 0;"><strong>Cupos reservados:</strong> ${ticket?.quantity || 1}</p>
            <p style="margin: 6px 0;"><strong>Estado:</strong> <span style="color: #059669; font-weight: bold;">${ticket?.status || 'confirmed'}</span></p>
          </div>

          <p style="font-size: 14px; color: #6b7280;">Presentá este código de reserva al presentarte en el evento.</p>
          <p style="margin-top: 30px;">¡Te deseamos el mayor de los éxitos en la jornada deportiva!</p>
        </div>
        <div style="background-color: #f3f4f6; color: #9ca3af; text-align: center; padding: 12px; font-size: 12px;">
          SportEventHub &bull; Plataforma de Gestión de Eventos Deportivos
        </div>
      </div>
    `;

    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: config.mail.from,
          to: recipientEmail,
          subject,
          html
        });
        console.log(`[MailService] Email enviado exitosamente a ${recipientEmail}: ${info.messageId}`);
        return info;
      } else {
        console.log(`[MailService SIMULATION] Email simulado para ${recipientEmail} [${reservationCode}]`);
        return { messageId: `simulated_${reservationCode}` };
      }
    } catch (error) {
      console.error(`[MailService Error] Error al enviar email a ${recipientEmail}:`, error.message);
      // Retorna null para no interrumpir el flujo de reserva
      return null;
    }
  }
}

export default new MailService();
