"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title="Something went wrong"
        description="This page hit an unexpected error. You can try again, or head back to your dashboard."
        onRetry={reset}
      />
    </div>
  );
}
