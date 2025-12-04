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



// "use client";
// import { useEffect, useState } from "react";
// import QRCode from "qrcode";

// export default function QRGenerator() {
//   const [tableId, setTableId] = useState("");
//   const [qrUrl, setQrUrl] = useState("");

//   const generateQR = async () => {
//     if (!tableId) return;
//     const url = `http://localhost:3000/table/${tableId}`; // Table page URL
//     try {
//       const dataUrl = await QRCode.toDataURL(url);
//       setQrUrl(dataUrl);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     generateQR();
//   }, [tableId]);

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Generate QR for Table</h1>

//       <input
//         type="number"
//         placeholder="Enter Table Number"
//         value={tableId}
//         onChange={(e) => setTableId(e.target.value)}
//         className="border p-2 rounded w-32 mb-4"
//       />

//       <button
//         onClick={generateQR}
//         className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
//       >
//         Generate
//       </button>

//       {qrUrl && (
//         <div className="mt-4">
//           <img src={qrUrl} alt={`QR for table ${tableId}`} />
//         </div>
//       )}
//     </div>
//   );
// }



// import QRCode from 'qrcode';
// import fs from 'fs';
// import path from 'path';
// import dotenv from 'dotenv';

// dotenv.config();

// const BASE_URL =  "http://192.168.18.181:3000";

// const tables = [1, 2, 3, 4, 5, 6]; 
// const qrFolder = path.join(process.cwd(), 'public', 'qrcodes');

// if (!fs.existsSync(qrFolder)) fs.mkdirSync(qrFolder, { recursive: true });

// tables.forEach(async (tableId) => {
//   const url = `${BASE_URL}/table/${tableId}`; 
//   const fileName = `table-${tableId}.png`;
//   const imgPath = path.join(qrFolder, fileName);

//   try {
//     await QRCode.toFile(imgPath, url);
//     console.log(`QR for table ${tableId} saved at ${imgPath}`);
//   } catch (err) {
//     console.error(err);
//   }
// });
