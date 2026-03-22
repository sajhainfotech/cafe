// "use client";
// import React, { useEffect, useState } from "react";

// import CustomerMenuPage from "./menu/page";
// import { useRouter } from "next/navigation";
// import { Commet } from "react-loading-indicators";

// const Main = () => {
//   const router = useRouter();
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     const adminToken = localStorage.getItem("adminToken");
//     if (!adminToken) {
//       router.replace("/auth/login");
//       return;
//     }
//     setIsAuthenticated(true);
//   }, []);
//   return (
//     <div>
//       {!isAuthenticated ? (
//         <div className="h-full w-full flex items-center justify-center">
//           {" "}
//           <Commet color="#fef3c6" size="medium" text="" textColor="" />
//         </div>
//       ) : (
//         <CustomerMenuPage />
//       )}
//     </div>
//   );
// };

// export default Main;

"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Main() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    // ✅ If QR token exists → go to menu (customer flow)
    const tableToken = searchParams.get("token");
    if (tableToken) {
      router.replace(`/menu?token=${tableToken}`);
      return;
    }

    // ✅ Admin flow
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [router, searchParams]);

  return null;
}

/*
"use client";
import React from "react";
import CustomerMenuPage from "./menu/page";

const Main = () => {
  return (
    <div>
      <CustomerMenuPage />
    </div>
  );
};

export default Main;
*/
