"use client";
import React, { useEffect, useState } from "react";

import CustomerMenuPage from "./menu/page";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";

const Main = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      router.replace("/auth/login");
      return;
    }
    setIsAuthenticated(true);
  }, []);
  return (
    <div>
      {!isAuthenticated ? (
        <div className="h-full w-full flex items-center justify-center">
          {" "}
          <Commet color="#fef3c6" size="medium" text="" textColor="" />
        </div>
      ) : (
        <CustomerMenuPage />
      )}
    </div>
  );
};

export default Main;
