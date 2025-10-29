
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Arrow, Text, Image as KonvaImage, Transformer, Group } from "react-konva";
import type Konva from "konva";
import { v4 as uuidv4 } from "uuid";
import PptxGenJS from "pptxgenjs";
import DisclaimerDialog from "./components/DisclaimerDialog";
import AttributeEditor from "./components/AttributeEditor";
import ContrastChecker from "./components/ContrastChecker";
import AICommandPanel from "./components/AICommandPanel";
import { useHistory } from "./hooks/useHistory";
import { AIService, initializeAIService, getAIService, AIEditResponse, CanvasState, ShapeDescription } from "./services/aiService";
import { createSVG, formatNumber, normalizeColor, escapeXML, sanitizeURL, downloadSVG, optimizeSVG } from "./utils/svgExport";

function useImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);
  return image;
}

type ShapeType = "rect" | "circle" | "line" | "arrow" | "text" | "image" | "group";

type ShapeBase = {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  draggable?: boolean;
  opacity?: number;
  name?: string;
  groupId?: string; // If this shape belongs to a group
};

type RectShape = ShapeBase & { type: "rect"; width: number; height: number; cornerRadius?: number };
type CircleShape = ShapeBase & { type: "circle"; radius: number };
type LineShape = ShapeBase & { type: "line"; points: number[]; tension?: number; closed?: boolean };
type ArrowShape = ShapeBase & { type: "arrow"; points: number[]; pointerLength?: number; pointerWidth?: number };
type TextShape = ShapeBase & { type: "text"; text: string; fontSize?: number; width?: number; align?: "left" | "center" | "right" };
type ImageShape = ShapeBase & { type: "image"; src: string; width?: number; height?: number };
type GroupShape = ShapeBase & { type: "group"; children: string[]; width?: number; height?: number };

type AnyShape = RectShape | CircleShape | LineShape | ArrowShape | TextShape | ImageShape | GroupShape;
type Connector = { id: string; type: "connector"; fromId: string; toId: string; points: number[]; stroke?: string; strokeWidth?: number };

export default function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [showAPIConfig, setShowAPIConfig] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('figurelab_disclaimer_accepted');
    if (accepted === 'true') {
      setDisclaimerAccepted(true);
      // Try to get last username
      try {
        const logs = JSON.parse(localStorage.getItem('figurelab_legal_acceptances') || '[]');
        if (logs.length > 0) {
          setCurrentUser(logs[logs.length - 1].username);
        }
      } catch (e) {
        console.error('Failed to retrieve user:', e);
      }
    }

    // Try to load API key
    const savedApiKey = localStorage.getItem('figurelab_openai_key');
    if (savedApiKey && AIService.validateApiKey(savedApiKey)) {
      const service = initializeAIService({ apiKey: savedApiKey });
      setAiService(service);
    }
  }, []);

  const handleDisclaimerAccept = (username: string) => {
    setCurrentUser(username);
    setDisclaimerAccepted(true);
  };

  const handleConfigureAPI = () => {
    const apiKey = prompt('Enter your OpenAI API key (starts with sk-):');
    if (apiKey && AIService.validateApiKey(apiKey)) {
      localStorage.setItem('figurelab_openai_key', apiKey);
      const service = initializeAIService({ apiKey });
      setAiService(service);
      alert('API key saved! You can now use AI commands.');
    } else if (apiKey) {
      alert('Invalid API key. Please check and try again.');
    }
  };

  const handleExecuteAIActions = (response: AIEditResponse) => {
    if (!response.success || !response.actions.length) return;

    response.actions.forEach(action => {
      switch (action.type) {
        case 'create':
          if (action.shapeType && action.properties) {
            const id = uuidv4();
            const newShape: any = {
              id,
              type: action.shapeType,
              draggable: true,
              ...action.properties
            };
            setShapes(s => [...s, newShape]);
            setSelectedIds([id]);
          }
          break;

        case 'modify':
        case 'recolor':
        case 'resize':
        case 'move':
          if (action.shapeId && action.properties) {
            updateShape(action.shapeId, action.properties);
          }
          break;

        case 'delete':
          if (action.shapeId) {
            setShapes(s => s.filter(sh => sh.id !== action.shapeId));
            setSelectedIds([]);
          }
          break;

        case 'group':
          if (action.targetIds && action.targetIds.length >= 2) {
            setSelectedIds(action.targetIds);
            setTimeout(() => groupSelected(), 100);
          }
          break;

        case 'ungroup':
          if (action.shapeId) {
            setSelectedIds([action.shapeId]);
            setTimeout(() => ungroupSelected(), 100);
          }
          break;

        case 'align':
          if (action.targetIds && action.properties?.direction) {
            setSelectedIds(action.targetIds);
            setTimeout(() => alignSelected(action.properties!.direction), 100);
          }
          break;
      }
    });
  };

  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [bg, setBg] = useState<string>("#ffffff");

  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Undo/Redo history for shapes and connectors
  interface CanvasState {
    shapes: AnyShape[];
    connectors: Connector[];
  }

  const {
    state: canvasState,
    setState: setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<CanvasState>({ shapes: [], connectors: [] });

  const shapes = canvasState.shapes;
  const connectors = canvasState.connectors;

  const setShapes = useCallback((updater: AnyShape[] | ((prev: AnyShape[]) => AnyShape[]), skipHistory = false) => {
    setCanvasState(prev => {
      const newShapes = typeof updater === 'function' ? updater(prev.shapes) : updater;
      return { ...prev, shapes: newShapes };
    }, skipHistory);
  }, [setCanvasState]);

  const setConnectors = useCallback((updater: Connector[] | ((prev: Connector[]) => Connector[]), skipHistory = false) => {
    setCanvasState(prev => {
      const newConnectors = typeof updater === 'function' ? updater(prev.connectors) : updater;
      return { ...prev, connectors: newConnectors };
    }, skipHistory);
  }, [setCanvasState]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selRect, setSelRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selStart = useRef<{ x: number; y: number } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;
    const nodes = selectedIds.map((id) => stage.findOne(`#${id}`)).filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, shapes]);

  const addRect = () => {
    const id = uuidv4();
    setShapes((s) => [...s, { id, type: "rect", x: 100, y: 100, width: 240, height: 140, cornerRadius: 12, fill: "#f8fafc", stroke: "#0f172a", strokeWidth: 2, draggable: true, name: "Rectangle" }]);
    setSelectedIds([id]);
  };
  const addCircle = () => {
    const id = uuidv4();
    setShapes((s) => [...s, { id, type: "circle", x: 300, y: 300, radius: 80, fill: "#eef2ff", stroke: "#0f172a", strokeWidth: 2, draggable: true, name: "Circle" }]);
    setSelectedIds([id]);
  };
  const addText = () => {
    const id = uuidv4();
    setShapes((s) => [...s, { id, type: "text", x: 160, y: 160, text: "Double‑click to edit", fontSize: 24, fill: "#0f172a", draggable: true, name: "Text" }]);
    setSelectedIds([id]);
  };
  const addLine = () => {
    const id = uuidv4();
    setShapes((s) => [...s, { id, type: "line", x: 0, y: 0, points: [120, 120, 360, 220], stroke: "#0f172a", strokeWidth: 3, draggable: true, name: "Line" }]);
    setSelectedIds([id]);
  };
  const addArrow = () => {
    const id = uuidv4();
    setShapes((s) => [...s, { id, type: "arrow", x: 0, y: 0, points: [200, 100, 420, 260], stroke: "#0f172a", strokeWidth: 3, pointerLength: 14, pointerWidth: 14, draggable: true, name: "Arrow" }]);
    setSelectedIds([id]);
  };
  const addImageFromFile = (file: File) => {
    const id = uuidv4();
    const reader = new FileReader();
    reader.onload = () => {
      setShapes((s) => [...s, { id, type: "image", x: 200, y: 200, src: reader.result as string, draggable: true, name: file.name }]);
      setSelectedIds([id]);
    };
    reader.readAsDataURL(file);
  };

  const updateShape = <T extends Partial<AnyShape>>(id: string, attrs: T) => {
    setShapes((s) => s.map((sh) => (sh.id === id ? ({ ...sh, ...attrs } as AnyShape) : sh)));
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    setShapes((s) => s.filter((sh) => !selectedIds.includes(sh.id)));
    setConnectors((cs) => cs.filter((c) => !selectedIds.includes(c.fromId) && !selectedIds.includes(c.toId)));
    setSelectedIds([]);
  };

  const bringForward = () => {
    if (!selectedIds.length) return;
    setShapes((s) => {
      const copy = [...s];
      selectedIds.forEach((id) => {
        const idx = copy.findIndex((sh) => sh.id === id);
        if (idx !== -1 && idx < copy.length - 1) {
          const [it] = copy.splice(idx, 1);
          copy.splice(idx + 1, 0, it);
        }
      });
      return copy;
    });
  };

  const bringToFront = () => {
    if (!selectedIds.length) return;
    setShapes((s) => {
      const selected = s.filter((sh) => selectedIds.includes(sh.id));
      const others = s.filter((sh) => !selectedIds.includes(sh.id));
      return [...others, ...selected];
    });
  };

  const sendBackward = () => {
    if (!selectedIds.length) return;
    setShapes((s) => {
      const copy = [...s];
      selectedIds.forEach((id) => {
        const idx = copy.findIndex((sh) => sh.id === id);
        if (idx > 0) {
          const [it] = copy.splice(idx, 1);
          copy.splice(idx - 1, 0, it);
        }
      });
      return copy;
    });
  };

  const sendToBack = () => {
    if (!selectedIds.length) return;
    setShapes((s) => {
      const selected = s.filter((sh) => selectedIds.includes(sh.id));
      const others = s.filter((sh) => !selectedIds.includes(sh.id));
      return [...selected, ...others];
    });
  };

  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    
    const groupId = uuidv4();
    const selectedShapes = shapes.filter((sh) => selectedIds.includes(sh.id));
    
    // Calculate bounding box for the group
    const xs = selectedShapes.map((s) => s.x);
    const ys = selectedShapes.map((s) => s.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    
    // Calculate max bounds based on shape types
    const maxX = Math.max(...selectedShapes.map((s) => {
      if (s.type === "rect") return s.x + (s as RectShape).width;
      if (s.type === "circle") return s.x + (s as CircleShape).radius;
      if (s.type === "image") return s.x + ((s as ImageShape).width || 300);
      return s.x + 100;
    }));
    const maxY = Math.max(...selectedShapes.map((s) => {
      if (s.type === "rect") return s.y + (s as RectShape).height;
      if (s.type === "circle") return s.y + (s as CircleShape).radius;
      if (s.type === "image") return s.y + ((s as ImageShape).height || 200);
      return s.y + 100;
    }));
    
    const group: GroupShape = {
      id: groupId,
      type: "group",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      name: `Group of ${selectedIds.length}`,
      children: selectedIds,
      draggable: true,
    };
    
    setShapes((s) => {
      // Mark children as belonging to this group
      const updatedShapes = s.map((sh) =>
        selectedIds.includes(sh.id) ? { ...sh, groupId } : sh
      );
      return [...updatedShapes, group];
    });
    
    setSelectedIds([groupId]);
  };

  const ungroupSelected = () => {
    if (selectedIds.length !== 1) return;
    const selectedId = selectedIds[0];
    const shape = shapes.find((s) => s.id === selectedId);
    
    if (!shape || shape.type !== "group") return;
    
    const group = shape as GroupShape;
    const childrenIds = group.children;
    
    setShapes((s) => {
      // Remove group, unmark children
      const updated = s
        .filter((sh) => sh.id !== selectedId)
        .map((sh) => (childrenIds.includes(sh.id) ? { ...sh, groupId: undefined } : sh));
      return updated;
    });
    
    setSelectedIds(childrenIds);
  };

  const snap = (val: number) => (snapEnabled ? Math.round(val / gridSize) * gridSize : val);

  const getBBox = (s: AnyShape) => {
    if (s.type === "circle") return { x: s.x - (s as CircleShape).radius, y: s.y - (s as CircleShape).radius, w: (s as CircleShape).radius * 2, h: (s as CircleShape).radius * 2 };
    const w = (s as any).width || 0; const h = (s as any).height || 0; return { x: s.x, y: s.y, w, h };
  };

  const routeConnector = (from: AnyShape, to: AnyShape): number[] => {
    const A = getBBox(from), B = getBBox(to);
    const centerA = { x: A.x + A.w / 2, y: A.y + A.h / 2 };
    const centerB = { x: B.x + B.w / 2, y: B.y + B.h / 2 };
    const horizontalFirst = Math.abs(centerA.x - centerB.x) > Math.abs(centerA.y - centerB.y);
    const start = { x: centerA.x, y: centerA.y };
    const end = { x: centerB.x, y: centerB.y };
    const via1 = horizontalFirst ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
    return [start.x, start.y, via1.x, via1.y, end.x, end.y];
  };

  const refreshConnectors = useCallback((nextShapes: AnyShape[]) => {
    setConnectors((curr) =>
      curr.map((c) => {
        const from = nextShapes.find((s) => s.id === c.fromId);
        const to = nextShapes.find((s) => s.id === c.toId);
        if (!from || !to) return c;
        return { ...c, points: routeConnector(from, to) };
      })
    );
  }, []);

  const alignSelected = (mode: "left" | "right" | "top" | "bottom" | "hcenter" | "vcenter") => {
    if (!selectedIds.length) return;
    setShapes((s) => {
      const next = s.map((sh) => {
        if (!selectedIds.includes(sh.id)) return sh;
        const attrs: any = {};
        const { width, height } = stageSize;
        if (mode === "left") attrs.x = 10;
        if (mode === "right") attrs.x = (sh as any).width ? width - (sh as any).width - 10 : width - 10;
        if (mode === "top") attrs.y = 10;
        if (mode === "bottom") attrs.y = (sh as any).height ? height - (sh as any).height - 10 : height - 10;
        if (mode === "hcenter") attrs.x = Math.max(0, (width - ((sh as any).width || 0)) / 2);
        if (mode === "vcenter") attrs.y = Math.max(0, (height - ((sh as any).height || 0)) / 2);
        return { ...sh, ...attrs } as AnyShape;
      });
      refreshConnectors(next);
      return next;
    });
  };

  const distribute = (axis: "h" | "v") => {
    const selected = shapes.filter((s) => selectedIds.includes(s.id));
    if (selected.length < 3) return;
    const boxes = selected.map((s) => ({ s, ...getBBox(s) }));
    const sorted = boxes.sort((a, b) => (axis === "h" ? a.x - b.x : a.y - b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = axis === "h" ? last.x - first.x : last.y - first.y;
    const sizes = sorted.map((b) => (axis === "h" ? b.w : b.h));
    const totalSize = sizes.reduce((a, c) => a + c, 0);
    const gaps = (span - (totalSize - (axis === "h" ? first.w : first.h))) / (sorted.length - 1);

    setShapes((all) => {
      const next = all.map((sh) => {
        const idx = sorted.findIndex((b) => b.s.id === sh.id);
        if (idx === -1) return sh;
        if (idx === 0 || idx === sorted.length - 1) return sh;
        let pos = axis === "h" ? first.x + first.w : first.y + first.h;
        for (let i = 1; i < idx; i++) {
          pos += (axis === "h" ? sorted[i].w : sorted[i].h) + gaps;
        }
        const delta = axis === "h" ? { x: pos } : { y: pos };
        return { ...sh, ...(delta as any) } as AnyShape;
      });
      refreshConnectors(next);
      return next;
    });
  };

  const connectSelected = () => {
    if (selectedIds.length !== 2) return;
    const [a, b] = selectedIds;
    const from = shapes.find((s) => s.id === a);
    const to = shapes.find((s) => s.id === b);
    if (!from || !to) return;
    const id = uuidv4();
    setConnectors((cs) => [...cs, { id, type: "connector", fromId: a, toId: b, points: routeConnector(from, to), stroke: "#0f172a", strokeWidth: 2 }]);
  };

  const downloadURI = (uri: string, name: string) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPNG = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 });
    downloadURI(uri, "figure.png");
  };

  const exportSVG_Konva = () => {
    const stage = stageRef.current as any;
    if (!stage || !stage.toSVG) { alert("SVG export not supported in this environment"); return; }
    const svg = stage.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    downloadURI(url, "figure.konva.svg");
    URL.revokeObjectURL(url);
  };

  const exportSVG_Native = (optimized: boolean = true) => {
    const content: string[] = [];
    
    // Render all shapes
    for (const s of shapes) {
      // Skip shapes that belong to a group (they'll be rendered with the group)
      if (s.groupId) continue;
      
      const rot = s.rotation || 0;
      const transform = rot ? ` transform="rotate(${formatNumber(rot)} ${formatNumber(s.x)} ${formatNumber(s.y)})"` : "";
      const strokeAttr = s.stroke ? ` stroke="${normalizeColor(s.stroke)}" stroke-width="${formatNumber(s.strokeWidth || 1)}"` : "";
      const fillAttr = s.fill ? ` fill="${normalizeColor(s.fill)}"` : ` fill="none"`;
      const opacityAttr = s.opacity && s.opacity < 1 ? ` opacity="${formatNumber(s.opacity)}"` : "";
      
      if (s.type === "rect") {
        const r = s as RectShape;
        content.push(
          `<rect x="${formatNumber(r.x)}" y="${formatNumber(r.y)}" ` +
          `width="${formatNumber(r.width)}" height="${formatNumber(r.height)}" ` +
          `rx="${formatNumber(r.cornerRadius || 0)}"` +
          `${fillAttr}${strokeAttr}${opacityAttr}${transform}/>`
        );
      } else if (s.type === "circle") {
        const c = s as CircleShape;
        content.push(
          `<circle cx="${formatNumber(c.x)}" cy="${formatNumber(c.y)}" ` +
          `r="${formatNumber(c.radius)}"` +
          `${fillAttr}${strokeAttr}${opacityAttr}${transform}/>`
        );
      } else if (s.type === "text") {
        const t = s as TextShape;
        const align = t.align ? ` text-anchor="${t.align === 'center' ? 'middle' : t.align === 'right' ? 'end' : 'start'}"` : "";
        content.push(
          `<text x="${formatNumber(t.x)}" y="${formatNumber(t.y + (t.fontSize || 24))}" ` +
          `font-size="${formatNumber(t.fontSize || 24)}" ` +
          `fill="${normalizeColor(s.fill || "#0f172a")}"` +
          `${align}${opacityAttr}${transform}>${escapeXML(t.text)}</text>`
        );
      } else if (s.type === "line") {
        const l = s as LineShape;
        const points = l.points.map(p => formatNumber(p)).join(",");
        content.push(
          `<polyline points="${points}" fill="none" ` +
          `stroke="${normalizeColor(s.stroke || "#000")}" ` +
          `stroke-width="${formatNumber(s.strokeWidth || 1)}"` +
          `${opacityAttr}${transform}/>`
        );
      } else if (s.type === "arrow") {
        const a = s as ArrowShape;
        const points = a.points.map(p => formatNumber(p)).join(",");
        content.push(
          `<polyline points="${points}" fill="none" ` +
          `stroke="${normalizeColor(s.stroke || "#000")}" ` +
          `stroke-width="${formatNumber(s.strokeWidth || 1)}" ` +
          `marker-end="url(#arrowhead)"` +
          `${opacityAttr}${transform}/>`
        );
      } else if (s.type === "image") {
        const im = s as ImageShape;
        const w = im.width || 300;
        const h = im.height || 200;
        const safeSrc = sanitizeURL(im.src);
        if (safeSrc) {
          content.push(
            `<image href="${safeSrc}" x="${formatNumber(im.x)}" y="${formatNumber(im.y)}" ` +
            `width="${formatNumber(w)}" height="${formatNumber(h)}"` +
            `${opacityAttr}${transform}/>`
          );
        }
      } else if (s.type === "group") {
        const g = s as GroupShape;
        content.push(
          `<rect x="${formatNumber(g.x)}" y="${formatNumber(g.y)}" ` +
          `width="${formatNumber(g.width || 100)}" height="${formatNumber(g.height || 100)}" ` +
          `fill="rgba(59, 130, 246, 0.05)" stroke="#94a3b8" stroke-width="1" stroke-dasharray="8,4"` +
          `${opacityAttr}${transform}/>`
        );
      }
    }
    
    // Render connectors
    for (const c of connectors) {
      const points = c.points.map(p => formatNumber(p)).join(",");
      content.push(
        `<polyline points="${points}" fill="none" ` +
        `stroke="${normalizeColor(c.stroke || "#0f172a")}" ` +
        `stroke-width="${formatNumber(c.strokeWidth || 2)}" ` +
        `marker-end="url(#arrowhead)"/>`
      );
    }
    
    const svg = createSVG(
      {
        width: stageSize.width,
        height: stageSize.height,
        background: bg,
        includeMetadata: true,
        prettify: !optimized,
        sanitize: true
      },
      content
    );
    
    const finalSVG = optimized ? optimizeSVG(svg) : svg;
    downloadSVG(finalSVG, 'figure.svg');
  };

  const exportProject = () => {
    const data = { __version: 3, __bg: bg, __size: stageSize, __grid: { showGrid, gridSize, snapEnabled }, __shapes: shapes, __connectors: connectors };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadURI(url, "project.figure.json");
    URL.revokeObjectURL(url);
  };
  const loadJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed.__shapes)) {
          // Reset history when loading a new project
          resetHistory({
            shapes: parsed.__shapes,
            connectors: parsed.__connectors || []
          });
          setBg(parsed.__bg || "#ffffff");
          setStageSize(parsed.__size || { width: 1200, height: 800 });
          if (parsed.__grid) {
            setShowGrid(!!parsed.__grid.showGrid);
            setGridSize(parsed.__grid.gridSize || 20);
            setSnapEnabled(!!parsed.__grid.snapEnabled);
          }
        } else {
          alert("This JSON isn't a saved project from this app.");
        }
      } catch (e: any) {
        alert("Could not load JSON: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const pxToIn = (px: number) => px / 96;
  const exportPPTX = async () => {
    const pptx = new PptxGenJS();
    const wIn = pxToIn(stageSize.width), hIn = pxToIn(stageSize.height);
    // @ts-ignore
    pptx.defineLayout({ name: "CANVAS", width: wIn, height: hIn });
    // @ts-ignore
    pptx.layout = "CANVAS";
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: wIn, h: hIn, fill: { color: bg.replace("#", "") } });
    for (const s of shapes) {
      const common: any = { x: pxToIn(s.x), y: pxToIn(s.y), rotate: s.rotation || 0, fill: s.fill ? { color: (s.fill || "#ffffff").replace("#", "") } : undefined, line: s.stroke ? { color: (s.stroke || "#000000").replace("#", ""), width: pxToIn(s.strokeWidth || 1) } : undefined };
      if (s.type === "rect") {
        const r = s as RectShape; slide.addShape(pptx.ShapeType.roundRect, { ...common, w: pxToIn(r.width), h: pxToIn(r.height), rectRadius: (r.cornerRadius || 0) / Math.max(r.width, r.height) });
      } else if (s.type === "circle") {
        const c = s as CircleShape; slide.addShape(pptx.ShapeType.ellipse, { ...common, w: pxToIn(c.radius * 2), h: pxToIn(c.radius * 2) });
      } else if (s.type === "text") {
        const t = s as TextShape; slide.addText(t.text, { x: common.x, y: common.y, w: pxToIn((t.width || 600)), h: pxToIn(50), fontSize: t.fontSize || 24, color: (s.fill || "#0f172a").replace("#", ""), align: (t.align || "left") as any, rotate: common.rotate });
      } else if (s.type === "line") {
        const l = s as LineShape; if (l.points.length >= 4) slide.addShape(pptx.ShapeType.line, { ...common, x: pxToIn(l.points[0]), y: pxToIn(l.points[1]), w: pxToIn(l.points[2] - l.points[0]), h: pxToIn(l.points[3] - l.points[1]) });
      } else if (s.type === "arrow") {
        const a = s as ArrowShape; if (a.points.length >= 4) slide.addShape(pptx.ShapeType.line, { ...common, x: pxToIn(a.points[0]), y: pxToIn(a.points[1]), w: pxToIn(a.points[2] - a.points[0]), h: pxToIn(a.points[3] - a.points[1]), line: { ...(common.line || {}), endArrow: true } });
      } else if (s.type === "image") {
        const im = s as ImageShape; slide.addImage({ data: im.src, x: common.x, y: common.y, w: pxToIn(im.width || 300), h: pxToIn(im.height || 200) });
      }
    }
    for (const c of connectors) {
      if (c.points.length >= 4) slide.addShape(pptx.ShapeType.line, { x: pxToIn(c.points[0]), y: pxToIn(c.points[1]), w: pxToIn(c.points[c.points.length - 2] - c.points[0]), h: pxToIn(c.points[c.points.length - 1] - c.points[1]), line: { color: ("#0f172a").replace("#", ""), width: pxToIn(c.strokeWidth || 2), endArrow: true } });
    }
    await pptx.writeFile({ fileName: "figure.pptx" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) && canRedo) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) deleteSelected();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selectedIds.length) {
        e.preventDefault();
        setShapes((s) => {
          const copies: AnyShape[] = [];
          const base = s.slice();
          for (const id of selectedIds) {
            const idx = base.findIndex((sh) => sh.id === id);
            if (idx !== -1) {
              const orig = base[idx];
              const copy = { ...orig, id: uuidv4(), x: (orig.x || 0) + 20, y: (orig.y || 0) + 20 } as AnyShape;
              copies.push(copy);
            }
          }
          const next = [...s, ...copies];
          refreshConnectors(next);
          return next;
        });
      }
      if (selectedIds.length && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? gridSize : 2;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setShapes((s) => {
          const next = s.map((sh) => (selectedIds.includes(sh.id) ? ({ ...sh, x: sh.x + dx, y: sh.y + dy } as AnyShape) : sh));
          refreshConnectors(next);
          return next;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelected(); // Ctrl/Cmd+Shift+G to ungroup
        } else if (selectedIds.length >= 2) {
          groupSelected(); // Ctrl/Cmd+G to group
        } else if (selectedIds.length === 2) {
          connectSelected(); // Fallback for connecting two shapes
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, gridSize, refreshConnectors, canUndo, canRedo, undo, redo]);

  const active = useMemo(() => (selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) || null : null), [shapes, selectedIds]);
  const updateActive = (k: string, v: any) => { if (!active) return; updateShape(active.id, { [k]: v } as any); refreshConnectors(shapes.map((sh) => (sh.id === active.id ? ({ ...sh, [k]: v } as AnyShape) : sh))); };

  // Generate canvas state for AI
  const getCanvasState = useCallback((): CanvasState => {
    return {
      shapes: shapes.map(s => ({
        type: s.type,
        id: s.id,
        properties: {
          x: s.x,
          y: s.y,
          rotation: s.rotation,
          fill: s.fill,
          stroke: s.stroke,
          opacity: s.opacity,
          ...(s.type === 'rect' && { width: (s as RectShape).width, height: (s as RectShape).height }),
          ...(s.type === 'circle' && { radius: (s as CircleShape).radius }),
          ...(s.type === 'text' && { text: (s as TextShape).text, fontSize: (s as TextShape).fontSize })
        }
      })),
      canvasWidth: stageSize.width,
      canvasHeight: stageSize.height
    };
  }, [shapes, stageSize]);

  if (!disclaimerAccepted) {
    return <DisclaimerDialog onAccept={handleDisclaimerAccept} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <div className="font-semibold text-lg">FigureLab</div>
          {currentUser && <div className="text-sm text-slate-600 px-3 py-1 bg-slate-100 rounded-full">👤 {currentUser}</div>}
          {aiService && <div className="text-xs text-green-600 px-2 py-1 bg-green-50 rounded-full">🤖 AI Ready</div>}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button 
              onClick={undo} 
              disabled={!canUndo} 
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100" 
              title="Undo (Ctrl/Cmd+Z)"
            >
              ↶ Undo
            </button>
            <button 
              onClick={redo} 
              disabled={!canRedo} 
              className="px-3 py-1.5 rounded-xl border text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100" 
              title="Redo (Ctrl/Cmd+Y)"
            >
              ↷ Redo
            </button>
            <div className="border-r h-6" />
            <button onClick={addRect} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Rectangle</button>
            <button onClick={addCircle} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Circle</button>
            <button onClick={addLine} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Line</button>
            <button onClick={addArrow} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Arrow</button>
            <button onClick={addText} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Text</button>
            <label className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm cursor-pointer">Upload Image<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageFromFile(f); }} /></label>

            <button onClick={bringToFront} className="px-2 py-1 rounded-xl border text-sm" title="Bring selected to very front">⬆⬆ To Front</button>
            <button onClick={bringForward} className="px-2 py-1 rounded-xl border text-sm" title="Bring selected forward one layer">⬆ Forward</button>
            <button onClick={sendBackward} className="px-2 py-1 rounded-xl border text-sm" title="Send selected backward one layer">⬇ Backward</button>
            <button onClick={sendToBack} className="px-2 py-1 rounded-xl border text-sm" title="Send selected to very back">⬇⬇ To Back</button>
            <div className="border-r h-6" />
            <button onClick={groupSelected} disabled={selectedIds.length < 2} className="px-2 py-1 rounded-xl border text-sm disabled:opacity-30 disabled:cursor-not-allowed" title="Group selected (Ctrl/Cmd+G)">🔗 Group</button>
            <button onClick={ungroupSelected} className="px-2 py-1 rounded-xl border text-sm" title="Ungroup selected (Ctrl/Cmd+Shift+G)">⛓️‍💥 Ungroup</button>

            <button onClick={exportPNG} className="px-3 py-1.5 rounded-2xl bg-emerald-600 text-white text-sm">Export PNG</button>
            <button onClick={exportSVG_Konva} className="px-3 py-1.5 rounded-2xl bg-emerald-600 text-white text-sm">Export SVG (Konva)</button>
            <button onClick={exportSVG_Native} className="px-3 py-1.5 rounded-2xl bg-emerald-600 text-white text-sm">Export SVG (Native)</button>
            <button onClick={exportPPTX} className="px-3 py-1.5 rounded-2xl bg-emerald-600 text-white text-sm">Export PPTX</button>

            <button onClick={exportProject} className="px-3 py-1.5 rounded-2xl bg-sky-600 text-white text-sm">Save Project</button>
            <label className="px-3 py-1.5 rounded-2xl border text-sm cursor-pointer">Load Project<input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadJSON(f!); }} /></label>

            <div className="flex items-center gap-2 border rounded-2xl px-2 py-1.5">
              <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Grid</label>
              <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} /> Snap</label>
              <input type="number" min={5} step={1} className="w-16 border rounded px-2 py-1 text-sm" value={gridSize} onChange={(e) => setGridSize(Math.max(5, Number(e.target.value)))} />
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => alignSelected("left")} className="px-2 py-1 rounded-xl border text-sm">Align L</button>
              <button onClick={() => alignSelected("hcenter")} className="px-2 py-1 rounded-xl border text-sm">Align H‑C</button>
              <button onClick={() => alignSelected("right")} className="px-2 py-1 rounded-xl border text-sm">Align R</button>
              <button onClick={() => alignSelected("top")} className="px-2 py-1 rounded-xl border text-sm">Align T</button>
              <button onClick={() => alignSelected("vcenter")} className="px-2 py-1 rounded-xl border text-sm">Align V‑C</button>
              <button onClick={() => alignSelected("bottom")} className="px-2 py-1 rounded-xl border text-sm">Align B</button>
              <button onClick={() => distribute("h")} className="px-2 py-1 rounded-xl border text-sm">Distribute H</button>
              <button onClick={() => distribute("v")} className="px-2 py-1 rounded-xl border text-sm">Distribute V</button>
              <button onClick={connectSelected} className="px-2 py-1 rounded-xl border text-sm" title="Connect two selected (Ctrl/Cmd+G)">Connect</button>
            </div>

            <button onClick={deleteSelected} className="px-3 py-1.5 rounded-2xl bg-rose-600 text-white text-sm">Delete</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 grid grid-cols-12 gap-4">
        <section className="col-span-9">
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm">Canvas W×H</label>
            <input type="number" className="w-24 border rounded-xl px-2 py-1" value={stageSize.width} onChange={(e) => setStageSize((s) => ({ ...s, width: Number(e.target.value) }))} />
            <input type="number" className="w-24 border rounded-xl px-2 py-1" value={stageSize.height} onChange={(e) => setStageSize((s) => ({ ...s, height: Number(e.target.value) }))} />
            <label className="text-sm ml-4">Background</label>
            <input type="color" className="h-8 w-12 border rounded" value={bg} onChange={(e) => setBg(e.target.value)} />
          </div>

          <div className="rounded-2xl overflow-hidden shadow bg-white p-3">
            <div style={{ background: bg }} className="rounded-xl overflow-hidden border border-slate-200">
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={(e) => {
                  const stage = e.target.getStage();
                  const clickedOnEmpty = stage === e.target;
                  if (clickedOnEmpty) {
                    const pos = stage?.getPointerPosition();
                    if (!pos) return;
                    selStart.current = pos; setSelRect({ x: pos.x, y: pos.y, w: 0, h: 0 }); setIsSelecting(true);
                    setSelectedIds([]);
                  }
                }}
                onMouseMove={(e) => {
                  if (!isSelecting || !selStart.current) return;
                  const pos = e.target.getStage()?.getPointerPosition(); if (!pos) return;
                  const x = Math.min(selStart.current.x, pos.x); const y = Math.min(selStart.current.y, pos.y);
                  const w = Math.abs(pos.x - selStart.current.x); const h = Math.abs(pos.y - selStart.current.y);
                  setSelRect({ x, y, w, h });
                }}
                onMouseUp={() => {
                  if (isSelecting && selRect) {
                    const hit = shapes.filter((s) => {
                      const b = getBBox(s);
                      return b.x >= selRect.x && b.y >= selRect.y && b.x + b.w <= selRect.x + selRect.w && b.y + b.h <= selRect.y + selRect.h;
                    }).map((s) => s.id);
                    setSelectedIds(hit);
                  }
                  setIsSelecting(false); setSelRect(null); selStart.current = null;
                }}
              >
                <Layer ref={layerRef}>
                  {showGrid && (
                    <Group listening={false}>
                      {Array.from({ length: Math.floor(stageSize.width / gridSize) + 1 }).map((_, i) => (
                        <Line key={"vg" + i} points={[i * gridSize, 0, i * gridSize, stageSize.height]} stroke="#e2e8f0" strokeWidth={1} />
                      ))}
                      {Array.from({ length: Math.floor(stageSize.height / gridSize) + 1 }).map((_, i) => (
                        <Line key={"hg" + i} points={[0, i * gridSize, stageSize.width, i * gridSize]} stroke="#e2e8f0" strokeWidth={1} />
                      ))}
                    </Group>
                  )}

                  {connectors.map((c) => (
                    <Line key={c.id} points={c.points} stroke={c.stroke || "#0f172a"} strokeWidth={c.strokeWidth || 2} lineCap="round" lineJoin="round" />
                  ))}

                  {shapes.map((s) => {
                    const selected = isSelected(s.id);
                    const common = {
                      key: s.id,
                      id: s.id,
                      x: s.x,
                      y: s.y,
                      rotation: s.rotation || 0,
                      opacity: s.opacity || 1,
                      draggable: true,
                      onClick: (e: any) => {
                        const multi = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
                        setSelectedIds((prev) => multi ? (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]) : [s.id]);
                      },
                      onTap: () => setSelectedIds([s.id]),
                      onDragMove: (e: any) => {
                        if (!snapEnabled) return;
                        const node = e.target; node.x(snap(node.x())); node.y(snap(node.y()));
                        layerRef.current?.batchDraw();
                        const next = shapes.map((sh) => (sh.id === s.id ? ({ ...sh, x: node.x(), y: node.y() } as AnyShape) : sh));
                        refreshConnectors(next);
                      },
                      onDragEnd: (e: any) => {
                        updateShape(s.id, { x: snap(e.target.x()), y: snap(e.target.y()) } as any);
                        refreshConnectors(shapes.map((sh) => (sh.id === s.id ? ({ ...sh, x: snap(e.target.x()), y: snap(e.target.y()) } as AnyShape) : sh)));
                      },
                      onTransformEnd: (e: any) => {
                        const node = e.target as any; const attrs: any = { x: snap(node.x()), y: snap(node.y()), rotation: node.rotation() };
                        if (s.type === "rect") { attrs.width = Math.max(5, snap(node.width() * node.scaleX())); attrs.height = Math.max(5, snap(node.height() * node.scaleY())); node.scaleX(1); node.scaleY(1); }
                        if (s.type === "circle") { const newR = Math.max(5, snap((node.radius() as number) * node.scaleX())); attrs.radius = newR; node.scaleX(1); node.scaleY(1); }
                        if (s.type === "image") { attrs.width = Math.max(5, snap(node.width() * node.scaleX())); attrs.height = Math.max(5, snap(node.height() * node.scaleY())); node.scaleX(1); node.scaleY(1); }
                        updateShape(s.id, attrs);
                        refreshConnectors(shapes.map((sh) => (sh.id === s.id ? ({ ...sh, ...attrs } as AnyShape) : sh)));
                      },
                    } as any;

                    switch (s.type) {
                      case "rect":
                        return (<Rect {...common} width={(s as RectShape).width} height={(s as RectShape).height} cornerRadius={(s as RectShape).cornerRadius || 0} fill={s.fill} stroke={selected ? "#2563eb" : s.stroke} strokeWidth={selected ? 3 : s.strokeWidth} />);
                      case "circle":
                        return (<Circle {...common} radius={(s as CircleShape).radius} fill={s.fill} stroke={selected ? "#2563eb" : s.stroke} strokeWidth={selected ? 3 : s.strokeWidth} />);
                      case "line":
                        return (<Line {...common} points={(s as LineShape).points} stroke={selected ? "#2563eb" : s.stroke} strokeWidth={selected ? 3 : s.strokeWidth} tension={(s as LineShape).tension || 0} />);
                      case "arrow":
                        return (<Arrow {...common} points={(s as ArrowShape).points} stroke={selected ? "#2563eb" : s.stroke} strokeWidth={selected ? 3 : s.strokeWidth} pointerLength={(s as ArrowShape).pointerLength || 12} pointerWidth={(s as ArrowShape).pointerWidth || 12} fill={s.stroke} />);
                      case "text":
                        return (<Text {...common} text={(s as TextShape).text} fontSize={(s as TextShape).fontSize || 24} width={(s as TextShape).width} fill={s.fill || "#0f172a"} onDblClick={() => { const newText = prompt("Edit text", (s as TextShape).text); if (newText != null) updateShape(s.id, { text: newText } as any); }} />);
                      case "image": {
                        const img = useImage((s as ImageShape).src);
                        return (<KonvaImage {...common} image={img as any} width={(s as ImageShape).width || (img ? img.width : 300)} height={(s as ImageShape).height || (img ? img.height : 200)} />);
                      }
                      case "group": {
                        const group = s as GroupShape;
                        return (
                          <Rect 
                            {...common} 
                            width={group.width || 100} 
                            height={group.height || 100} 
                            fill="rgba(59, 130, 246, 0.05)" 
                            stroke={selected ? "#2563eb" : "#94a3b8"} 
                            strokeWidth={selected ? 2 : 1}
                            dash={[8, 4]}
                          />
                        );
                      }
                      default:
                        return null;
                    }
                  })}

                  {isSelecting && selRect && (
                    <Rect x={selRect.x} y={selRect.y} width={selRect.w} height={selRect.h} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" dash={[4, 4]} listening={false} />
                  )}

                  <Transformer ref={trRef} rotateEnabled={true} enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]} boundBoxFunc={(oldBox, newBox) => { if (newBox.width < 5 || newBox.height < 5) return oldBox; return newBox; }} />
                </Layer>
              </Stage>
            </div>
          </div>
        </section>

        <aside className="col-span-3">
          <div className="bg-white rounded-2xl shadow p-4 space-y-4 border border-slate-200 mb-4">
            <AICommandPanel
              aiService={aiService}
              currentState={getCanvasState()}
              selectedShapes={selectedIds}
              onExecuteActions={handleExecuteAIActions}
              onConfigureAPI={handleConfigureAPI}
            />
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-4 border border-slate-200">
            <h3 className="font-semibold">Inspector</h3>
            {selectedIds.length === 0 && <div className="text-sm text-slate-500">Select one or more elements. Shift/Cmd click, or drag to marquee-select.</div>}
            {(() => {
              const active = (selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) || null : null);
              if (!active) return null;
              return (
                <div className="space-y-3 text-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{active.type}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">X<input className="w-20 border rounded px-2 py-1" type="number" value={active.x} onChange={(e) => updateShape(active.id, { x: Number(e.target.value) } as any)} /></label>
                    <label className="flex items-center gap-2">Y<input className="w-20 border rounded px-2 py-1" type="number" value={active.y} onChange={(e) => updateShape(active.id, { y: Number(e.target.value) } as any)} /></label>
                    <label className="flex items-center gap-2">Rot<input className="w-20 border rounded px-2 py-1" type="number" value={active.rotation || 0} onChange={(e) => updateShape(active.id, { rotation: Number(e.target.value) } as any)} /></label>
                  </div>
                  {active.type === "rect" && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2">W<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).width} onChange={(e) => updateShape(active.id, { width: Number(e.target.value) } as any)} /></label>
                      <label className="flex items-center gap-2">H<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).height} onChange={(e) => updateShape(active.id, { height: Number(e.target.value) } as any)} /></label>
                      <label className="flex items-center gap-2">Radius<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).cornerRadius || 0} onChange={(e) => updateShape(active.id, { cornerRadius: Number(e.target.value) } as any)} /></label>
                    </div>
                  )}
                  {active.type === "circle" && (
                    <label className="flex items-center gap-2">Radius<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).radius} onChange={(e) => updateShape(active.id, { radius: Number(e.target.value) } as any)} /></label>
                  )}
                  {active.type === "text" && (
                    <>
                      <label className="block">Text<textarea className="w-full border rounded px-2 py-1" value={(active as any).text} onChange={(e) => updateShape(active.id, { text: e.target.value } as any)} /></label>
                      <label className="flex items-center gap-2">Font Size<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).fontSize || 24} onChange={(e) => updateShape(active.id, { fontSize: Number(e.target.value) } as any)} /></label>
                      <label className="flex items-center gap-2">Width<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).width || 0} onChange={(e) => updateShape(active.id, { width: Number(e.target.value) || undefined } as any)} /></label>
                    </>
                  )}
                  {active.type === "image" && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2">W<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).width || 300} onChange={(e) => updateShape(active.id, { width: Number(e.target.value) } as any)} /></label>
                      <label className="flex items-center gap-2">H<input className="w-24 border rounded px-2 py-1" type="number" value={(active as any).height || 200} onChange={(e) => updateShape(active.id, { height: Number(e.target.value) } as any)} /></label>
                    </div>
                  )}
                  <AttributeEditor
                    shapeId={active.id}
                    currentFill={active.fill}
                    currentStroke={active.stroke}
                    currentOpacity={active.opacity}
                    currentStrokeWidth={active.strokeWidth}
                    onUpdate={(updates) => updateShape(active.id, updates as any)}
                  />
                  <div className="space-y-2 pt-2">
                    <div className="text-xs uppercase tracking-wide text-slate-500">Layer Order</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={bringToFront} className="px-2 py-1 rounded-xl border text-xs hover:bg-slate-100">⬆⬆ To Front</button>
                      <button onClick={bringForward} className="px-2 py-1 rounded-xl border text-xs hover:bg-slate-100">⬆ Forward</button>
                      <button onClick={sendBackward} className="px-2 py-1 rounded-xl border text-xs hover:bg-slate-100">⬇ Backward</button>
                      <button onClick={sendToBack} className="px-2 py-1 rounded-xl border text-xs hover:bg-slate-100">⬇⬇ To Back</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3 mt-4 border border-slate-200">
            <ContrastChecker 
              foregroundColor={selectedIds.length === 1 ? shapes.find(s => s.id === selectedIds[0])?.fill : undefined}
              backgroundColor={bg}
            />
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3 mt-4 border border-slate-200">
            <h3 className="font-semibold">Shortcuts</h3>
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Shift/Cmd click to multi-select</li>
              <li>Drag on empty space to marquee-select</li>
              <li>Ctrl/Cmd + D to duplicate selection</li>
              <li>Ctrl/Cmd + G to group (Shift+G to ungroup)</li>
              <li>Ctrl/Cmd + Z to undo, Ctrl/Cmd + Y to redo</li>
              <li>Arrow keys to nudge (hold Shift for grid step)</li>
              <li>Double‑click text to edit inline</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="max-w-[1400px] mx-auto px-4 pb-6 pt-2 text-xs text-slate-500">Built with React + Konva. Multi‑select, distribute, connectors, PNG/SVG/PPTX export, and JSON projects.</footer>
    </div>
  );
}
