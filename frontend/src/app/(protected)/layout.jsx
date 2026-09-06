import { Suspense } from "react";
import Navbar from "@/components/navbar/Navbar";
import AppearanceApplier from "@/components/theme/AppearanceApplier";
import ToastHost from "@/components/toast/ToastHost";

export default function ProtectedLayout({ children }) {
  return (
      <>

        <AppearanceApplier />

        <ToastHost />
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
        </Suspense>
        <main>
          {children}
        </main>
      </>
  );
}
