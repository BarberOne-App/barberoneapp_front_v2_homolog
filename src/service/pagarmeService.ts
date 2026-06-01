import api from "./api";

export interface PagarmeRecipientPayload {
  barbershopId: string;
  linkBarbershop: true;
  code?: string;
  register_information: {
    name: string;
    email: string;
    type: "individual" | "company";
    document: string;
    birthdate?: string;
    monthly_income?: number;
    professional_occupation?: string;
    phone_numbers: Array<{ ddd: string; number: string; type: string }>;
    address: {
      street: string;
      street_number: string;
      complementary?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
      reference_point?: string;
    };
  };
  default_bank_account: {
    holder_name: string;
    holder_type: "individual" | "company";
    holder_document: string;
    bank: string;
    branch_number: string;
    branch_check_digit?: string;
    account_number: string;
    account_check_digit: string;
    type: "checking" | "savings";
  };
  transfer_settings?: {
    transfer_enabled: boolean;
    transfer_interval: string;
    transfer_day?: number;
  };
}

export async function createPagarmeRecipient(payload: PagarmeRecipientPayload) {
  const response = await api.post("/pagarme/recipients", payload);
  return response.data;
}

export async function getPagarmeRecipient(recipientId: string) {
  const response = await api.get(`/pagarme/recipients/${recipientId}`);
  return response.data;
}

export async function updatePagarmeRecipient(
  recipientId: string,
  payload: PagarmeRecipientPayload & { recipientId: string }
) {
  const response = await api.put(`/pagarme/recipients/${recipientId}`, payload);
  return response.data;
}
