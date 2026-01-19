'use client';
import { Suspense } from "react";
import CustomerMenu from "./CustomerMenu.jsx";


export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
        </div>
      }
    >
      <CustomerMenu />
    </Suspense>
  );
}
