import QRCode from "qrcode";

export async function generateQRCodeByData(data: string) {
  try {
    const qrCodeImage = await QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
    });

    return qrCodeImage;
  } catch (error) {
    throw new Error("Gagal menghasilkan QR code");
  }
}
