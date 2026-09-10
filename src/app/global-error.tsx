"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#fafafa", color: "#171717", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600 }}>Life Hub hit a snag</h1>
            <p style={{ fontSize: 14, color: "#555" }}>
              Something went wrong loading the app. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 8,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
