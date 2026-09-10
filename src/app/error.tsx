"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <ErrorState
          title="Something went wrong"
          description="An unexpected error occurred. Please try again."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
