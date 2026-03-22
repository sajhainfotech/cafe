// import { Suspense } from "react";
// import CustomerMenu from "./CustomerMenu.jsx";
// import { headers } from "next/headers";

// export const revalidate = 0; // disables ISR, forces fresh render

// export default function Page() {
//   return (
//     <Suspense
//       fallback={
//         <div className="min-h-screen flex items-center justify-center"></div>
//       }
//     >
//       <CustomerMenu />
//     </Suspense>
//   );
// }

"use client";

import CustomerMenu from "./CustomerMenu.jsx";

export const revalidate = 0; // disables ISR, forces fresh render

export default function Page() {
  return <CustomerMenu />;
}
