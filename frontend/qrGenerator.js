import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import dotenv from "dotenv"



dotenv.config();


// const BASE_URL =process.env.NEXT_PUBLIC_URL;

 const BASE_URL =process.env.NEXT_PUBLIC_URL_NETWORK;


// Tables list
const tables = [1, 2, 3, 4, 5, 6]; 

// Folder path
 const outputFolder = "C:\\cafe\\qr-images";
//const qrFolder = path.join(process.cwd(), 'public', 'qrcodes');

// Folder exists check
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
  console.log(" Created folder: " + outputFolder);
}


// table ko QR create banune loop
tables.forEach(async (tableId) => {
  const url = `${BASE_URL}/table/${tableId}`; 
  const fileName = `table-${tableId}.png`;
  const imgPath = path.join(outputFolder, fileName);

  try {
    await QRCode.toFile(imgPath, url);
    console.log(` QR code for table ${tableId} saved at ${imgPath}`);
  } catch (err) {
    console.error(` Failed to generate QR code for table ${tableId}:`, err);
  }
});

