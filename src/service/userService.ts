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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  photoUrl?: string | null;
}

export async function updateProfilePhoto(userId: string, photoUrl: string | null) {
  const response = await api.patch<UserProfile>(`/users/${userId}`, {
    photoUrl,
  });

  return response.data;
}
