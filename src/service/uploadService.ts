import axios from 'axios';

interface CloudinaryUploadResponse {
  secure_url?: string;
}

export async function uploadHeroImage(file: File) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Configuracao do Cloudinary nao encontrada.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await axios.post<CloudinaryUploadResponse>(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    formData
  );

  if (!response.data.secure_url) {
    throw new Error('Cloudinary nao retornou a URL segura da imagem.');
  }

  return response.data.secure_url;
}
