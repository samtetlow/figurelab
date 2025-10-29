import React from "react";

type ShapeSummary = {
  id: string;
  name?: string;
  type?: string;
  visible?: boolean;
  locked?: boolean;
};

export default function LayersPanel({
  shapes,
  onToggleVisibility,
  onToggleLock,
  onSelect,
}: {
  shapes: ShapeSummary[];
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ maxWidth: 320, marginTop: 12 }}>
      <div style={{ background: "white", padding: 12, borderRadius: 12, border: "1px solid #e6eef6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>Layers</strong>
        </div>
        <div style={{ maxHeight: 360, overflow: "auto" }}>
          {shapes.slice().reverse().map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => onSelect(s.id)} style={{ padding: 6, borderRadius: 6, border: "1px solid #e2e8f0", background: "white" }}>
                  Select
                </button>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 13 }}>{s.name || s.type || s.id}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.id.slice(0, 8)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onToggleVisibility(s.id)} style={{ padding: 6, borderRadius: 6 }}>
                  {s.visible === false ? "Show" : "Hide"}
                </button>
                <button onClick={() => onToggleLock(s.id)} style={{ padding: 6, borderRadius: 6 }}>
                  {s.locked ? "Unlock" : "Lock"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
