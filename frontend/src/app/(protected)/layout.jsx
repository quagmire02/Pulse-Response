import { Suspense } from "react";
import Navbar from "@/components/navbar/Navbar";
import AppearanceApplier from "@/components/theme/AppearanceApplier";

export default function ProtectedLayout({ children }) {
  return (
      <>
        {/* Applies volunteer reward themes; renders nothing for everyone else. */}
        <AppearanceApplier />
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
        </Suspense>
        <main>
          {children}
        </main>
      </>
  );
}
