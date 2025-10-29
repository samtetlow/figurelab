import React, { useState } from "react";

export default function RightsDialog({ onAcknowledge }: { onAcknowledge: (username?: string) => void }) {
  const [name, setName] = useState<string>(""
  const [error, setError] = useState<string | null>(null);

  const accept = () => {
    // Simple minimal validation — allow empty but warn if blank
    if (!name.trim()) {
      setError("WE RECOMMEND ENTERING A NAME OR USER HANDLE FOR THE LOG.");
    }
    onAcknowledge(name.trim() || "unknown");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{ width: 560, background: "white", borderRadius: 12, padding: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Rights & Content Acknowledgement</h2>
        <p style={{ marginTop: 0, color: "#334155" }}>
          BY USING THIS PLATFORM YOU ACKNOWLEDGE YOU HAVE THE RIGHTS TO USE ANY IMAGES, FIGURES, OR OTHER CONTENT YOU UPLOAD OR EDIT.
          DO NOT UPLOAD THIRD-PARTY CONTENT YOU DO NOT HAVE RIGHTS TO.
        </p>

        <label style={{ display: "block", marginTop: 8, marginBottom: 6, color: "#475569" }}>Username / Handle (for the record)</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="Optional — e.g., samtetlow" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }} />

        {error && <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={() => { /* do nothing — require acknowledge to proceed */ }} style={{ padding: "8px 12px", borderRadius: 8, background: "#e2e8f0", border: "none" }}>Cancel</button>
          <button onClick={accept} style={{ padding: "8px 12px", borderRadius: 8, background: "#0369a1", color: "white", border: "none" }}>
            YES, UNDERSTOOD
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          We will store a local acknowledgement entry (username + timestamp). If you provide a server endpoint later we can also record this on the server.
        </div>
      </div>
    </div>
  );
}
