// utils/generateTableQR.js
import QRCode from "qrcode";

export async function generateTableQR(token) {
  if (!token) return null;

  const frontendUrl = process.env.NEXT_PUBLIC_CLIENT_URL;
  const qrUrl = `${frontendUrl}/menu?token=${token}`;

  try {
    const qrBase64 = await QRCode.toDataURL(qrUrl);
    return qrBase64;
  } catch (err) {
    console.error("QR generation failed:", err);
    return null;
  }
}
