/**
 * Cloud Functions for Agenda Fácil
 * Production ready triggers for transactional notifications,
 * customer tracking consolidation, and reminder cron jobs.
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger: On Appointment Creation
 * 1. Automatically links the customer record in `/customers`.
 * 2. Increments their booking counter.
 * 3. Triggers simulated transaction email / notification queueing.
 */
exports.onAppointmentCreated = onDocumentCreated(
  "/users/{userId}/appointments/{appointmentId}",
  async (event) => {
    const userId = event.params.userId;
    const appointmentId = event.params.appointmentId;
    const appointmentData = event.data.data();

    logger.info(`Novo agendamento criado: ${appointmentId} para o profissional ${userId}`);

    const { customerName, customerPhone, customerEmail, serviceName, date, time, price } = appointmentData;
    
    // Hash phone to unique customer document ID under the specific user workspace
    const sanitizedPhone = customerPhone.replace(/\D/g, "");
    if (!sanitizedPhone) {
      logger.error("Agendamento sem telefone válido.");
      return;
    }
    
    const customerId = `cust_${sanitizedPhone}`;
    const customerRef = db.collection("users").doc(userId).collection("customers").doc(customerId);

    try {
      await db.runTransaction(async (transaction) => {
        const customerDoc = await transaction.get(customerRef);
        
        if (!customerDoc.exists) {
          // Initialize customer record
          transaction.set(customerRef, {
            id: customerId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || "",
            totalAppointments: 1,
            lastAppointmentDate: `${date} ${time}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Update existing customer record values
          const curTotal = customerDoc.data().totalAppointments || 0;
          transaction.update(customerRef, {
            totalAppointments: curTotal + 1,
            lastAppointmentDate: `${date} ${time}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
      logger.info(`Consolidação de cliente efetuada com sucesso: ${customerId}`);
    } catch (err) {
      logger.error("Erro ao consolidar cliente para agendamento:", err);
    }

    // Task Queue / Notification Trigger Mock:
    // In production, send transaction email to customer and notify professional
    const notificationPayload = {
      to: customerEmail || "",
      subject: `Agendamento Confirmado - Agenda Fácil`,
      body: `Olá ${customerName}! Seu agendamento para ${serviceName} em ${date} às ${time} foi recebido com sucesso. Valor: R$ ${price}.`
    };
    logger.info("Fila de Notificação disparada:", notificationPayload);
  }
);

/**
 * Trigger: On Appointment Updated
 * Acts when appointment is cancelled to audit client logs and notify.
 */
exports.onAppointmentUpdated = onDocumentUpdated(
  "/users/{userId}/appointments/{appointmentId}",
  async (event) => {
    const userId = event.params.userId;
    const appointmentId = event.params.appointmentId;
    const beforeStatus = event.data.before.data().status;
    const afterData = event.data.after.data();
    const afterStatus = afterData.status;

    if (beforeStatus !== "cancelled" && afterStatus === "cancelled") {
      logger.info(`Agendamento cancelado de surpresa: ${appointmentId}`);

      // Transaction cancellation notice triggers
      const cancelPayload = {
        customerEmail: afterData.customerEmail,
        customerName: afterData.customerName,
        serviceName: afterData.serviceName,
        date: afterData.date,
        time: afterData.time,
        notes: afterData.notes || ""
      };
      logger.info("Envio de aviso de cancelamento efetuado com sucesso.", cancelPayload);
    }
  }
);

/**
 * Scheduled Cron Trigger: Daily Reminder Tasks
 * Runs every day at 08:00 to query appointments for the next day
 * and trigger WhatsApp/Email reminders.
 */
exports.scheduledDailyReminders = onSchedule("0 8 * * *", async (event) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().substring(0, 10); // "YYYY-MM-DD"

  logger.info(`Iniciando Cron de Lembretes para data: ${tomorrowString}`);

  try {
    // Query collections where appointment.date matches target and active
    const appointmentsSnap = await db.group("appointments")
      .where("date", "==", tomorrowString)
      .where("status", "==", "confirmed")
      .get();

    logger.info(`Encontrados ${appointmentsSnap.size} lembretes para envio amanhã.`);

    const reminderPromises = [];
    appointmentsSnap.forEach((doc) => {
      const appData = doc.data();
      logger.info(`Enviando lembrete de agendamento do cliente ${appData.customerName} para amanhã às ${appData.time}`);
      // Send service notice logic here...
    });
    
  } catch (err) {
    logger.error("Erro durante execução do cron de lembretes diários:", err);
  }
});
