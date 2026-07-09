import { Appointment } from '../types';

/**
 * Formats a date string from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateToBrazilian(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Prepares the phone number for the WhatsApp API payload by ensuring it starts with '55' (Brazil country code)
 */
export function formatPhoneForWhatsApp(phoneStr: string): string {
  const digits = phoneStr.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

/**
 * Sends a WhatsApp message when an appointment is confirmed
 */
export async function sendWhatsAppConfirmation(
  appointment: Appointment, 
  establishmentName: string,
  customPhoneNumberId?: string,
  customToken?: string
) {
  const phoneNumberId = customPhoneNumberId || (import.meta as any).env.VITE_WHATSAPP_PHONE_NUMBER_ID || "911523022053417";
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  const token = customToken || (import.meta as any).env.VITE_WHATSAPP_TOKEN;

  const targetPhone = formatPhoneForWhatsApp(appointment.customerPhone);
  const brDate = formatDateToBrazilian(appointment.date);
  
  // Parametros:
  // 1: Nome do cliente (João)
  // 2: Data (25/06/2026)
  // 3: Horário (14:00)
  // 4: Estabelecimento (O Nonato)
  const payload = {
    messaging_product: "whatsapp",
    to: targetPhone,
    type: "template",
    template: {
      name: "confirm_agendamento",
      language: {
        code: "pt_BR"
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: appointment.customerName
            },
            {
              type: "text",
              text: brDate
            },
            {
              type: "text",
              text: appointment.time
            },
            {
              type: "text",
              text: establishmentName || "O Nonato"
            }
          ]
        }
      ]
    }
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`Enviando mensagem WhatsApp para ${targetPhone}...`, JSON.stringify(payload));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do WhatsApp (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("Mensagem de WhatsApp enviada com sucesso:", data);
    return data;
  } catch (error) {
    console.error("Erro ao enviar mensagem WhatsApp:", error);
    throw error;
  }
}
