import { Suspense } from "react";
import Navbar from "@/components/navbar/Navbar";

export default function ProtectedLayout({ children }) {
  return (
      <>
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
        </Suspense>
        <main>
          {children}
        </main>
      </>
  );
}
