import api from "./api";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(
  userId: string,
  data: ChangePasswordPayload
) {
  const response = await api.patch(`/users/${userId}`, {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });

  return response.data;
}
