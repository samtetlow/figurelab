import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Line, Arrow, Text, Image as KonvaImage, Transformer, Group } from "react-konva";
import type Konva from "konva";
import { v4 as uuidv4 } from "uuid";
import PptxGenJS from "pptxgenjs";
import RightsDialog from "./components/RightsDialog";
import LayersPanel from "./components/LayersPanel";
import { useUndoRedo } from "./utils/undo";
import * as colorUtils from "./utils/color";

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

type ShapeType = "rect" | "circle" | "line" | "arrow" | "text" | "image";

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
  visible?: boolean;
  locked?: boolean;
  groupId?: string | null;
};

type RectShape = ShapeBase & { type: "rect"; width: number; height: number; cornerRadius?: number };
type CircleShape = ShapeBase & { type: "circle"; radius: number };
type LineShape = ShapeBase & { type: "line"; points: number[]; tension?: number; closed?: boolean };
type ArrowShape = ShapeBase & { type: "arrow"; points: number[]; pointerLength?: number; pointerWidth?: number };
type TextShape = ShapeBase & { type: "text"; text: string; fontSize?: number; width?: number; align?: "left" | "center" | "right" };
type ImageShape = ShapeBase & { type: "image"; src: string; width?: number; height?: number };

type AnyShape = RectShape | CircleShape | LineShape | ArrowShape | TextShape | ImageShape;
type Connector = { id: string; type: "connector"; fromId: string; toId: string; points: number[]; stroke?: string; strokeWidth?: number };

export default function App() {
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [bg, setBg] = useState<string>("#ffffff");

  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapEnabled, setSnapEnabled] = useState(true);

  const [shapes, setShapes] = useState<AnyShape[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selRect, setSelRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selStart = useRef<{ x: number; y: number } | null>(null);

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Rights dialog state
  const [acceptedRights, setAcceptedRights] = useState<boolean>(() => !!localStorage.getItem("figurelab_rights_ack"));

  // Layers panel
  const [layersOpen, setLayersOpen] = useState(false);

  // Point edit mode
  const [pointEditMode, setPointEditMode] = useState(false);

  // Undo / Redo
  const { pushSnapshot, undo, redo, canUndo, canRedo, reset } = useUndoRedo();

  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;
    const nodes = selectedIds.map((id) => stage.findOne(`#${id}`)).filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, shapes]);

  const snapshot = useCallback(() => ({ shapes, connectors, bg, stageSize }), [shapes, connectors, bg, stageSize]);

  // Push an initial snapshot
  useEffect(() => {
    pushSnapshot(snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRect = () => {
    const id = uuidv4();
    const next = [...shapes, { id, type: "rect", x: 100, y: 100, width: 240, height: 140, cornerRadius: 12, fill: "#f8fafc", stroke: "#0f172a", strokeWidth: 2, draggable: true, name: "Rectangle", visible: true }];
    setShapes(next);
    setSelectedIds([id]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };
  const addCircle = () => {
    const id = uuidv4();
    const next = [...shapes, { id, type: "circle", x: 300, y: 300, radius: 80, fill: "#eef2ff", stroke: "#0f172a", strokeWidth: 2, draggable: true, name: "Circle", visible: true }];
    setShapes(next);
    setSelectedIds([id]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };
  const addText = () => {
    const id = uuidv4();
    const next = [...shapes, { id, type: "text", x: 160, y: 160, text: "Double‑click to edit", fontSize: 24, fill: "#0f172a", draggable: true, name: "Text", visible: true }];
    setShapes(next);
    setSelectedIds([id]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };
  const addLine = () => {
    const id = uuidv4();
    const next = [...shapes, { id, type: "line", x: 0, y: 0, points: [120, 120, 360, 220], stroke: "#0f172a", strokeWidth: 3, draggable: true, name: "Line", visible: true }];
    setShapes(next);
    setSelectedIds([id]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };
  const addArrow = () => {
    const id = uuidv4();
    const next = [...shapes, { id, type: "arrow", x: 0, y: 0, points: [200, 100, 420, 260], stroke: "#0f172a", strokeWidth: 3, pointerLength: 14, pointerWidth: 14, draggable: true, name: "Arrow", visible: true }];
    setShapes(next);
    setSelectedIds([id]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };
  const addImageFromFile = (file: File) => {
    const id = uuidv4();
    const reader = new FileReader();
    reader.onload = () => {
      const next = [...shapes, { id, type: "image", x: 200, y: 200, src: reader.result as string, draggable: true, name: file.name, visible: true }];
      setShapes(next);
      setSelectedIds([id]);
      pushSnapshot({ shapes: next, connectors, bg, stageSize });
    };
    reader.readAsDataURL(file);
  };

  const updateShape = <T extends Partial<AnyShape>>(id: string, attrs: T, push = true) => {
    setShapes((s) => {
      const next = s.map((sh) => (sh.id === id ? ({ ...sh, ...attrs } as AnyShape) : sh));
      if (push) pushSnapshot({ shapes: next, connectors, bg, stageSize });
      return next;
    });
  };

  const deleteSelected = () => {
    if (!selectedIds.length) return;
    const nextShapes = shapes.filter((sh) => !selectedIds.includes(sh.id));
    const nextConnectors = connectors.filter((c) => !selectedIds.includes(c.fromId) && !selectedIds.includes(c.toId));
    setShapes(nextShapes);
    setConnectors(nextConnectors);
    setSelectedIds([]);
    pushSnapshot({ shapes: nextShapes, connectors: nextConnectors, bg, stageSize });
  };

  const bringForward = () => {
    if (!selectedIds.length) return;
    const copy = [...shapes];
    selectedIds.forEach((id) => {
      const idx = copy.findIndex((sh) => sh.id === id);
      if (idx !== -1 && idx < copy.length - 1) {
        const [it] = copy.splice(idx, 1);
        copy.splice(idx + 1, 0, it);
      }
    });
    setShapes(copy);
    pushSnapshot({ shapes: copy, connectors, bg, stageSize });
  };
  const sendBackward = () => {
    if (!selectedIds.length) return;
    const copy = [...shapes];
    selectedIds.forEach((id) => {
      const idx = copy.findIndex((sh) => sh.id === id);
      if (idx > 0) {
        const [it] = copy.splice(idx, 1);
        copy.splice(idx - 1, 0, it);
      }
    });
    setShapes(copy);
    pushSnapshot({ shapes: copy, connectors, bg, stageSize });
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
      pushSnapshot({ shapes: next, connectors, bg, stageSize });
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
      pushSnapshot({ shapes: next, connectors, bg, stageSize });
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
    const next = [...connectors, { id, type: "connector", fromId: a, toId: b, points: routeConnector(from, to), stroke: "#0f172a", strokeWidth: 2 }];
    setConnectors(next);
    pushSnapshot({ shapes, connectors: next, bg, stageSize });
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

  const sanitizeSvgString = (svg: string) => {
    // VERY BASIC SANITIZATION: strip script tags and on* attributes
    return svg.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/ on[a-zA-Z]+=\"[^\"]*\"/g, "").replace(/ on[a-zA-Z]+=\'[^\']*\'/g, "");
  };

  const exportSVG_Native = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svgParts: string[] = [];
    svgParts.push(`<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${stageSize.width}\" height=\"${stageSize.height}\" viewBox=\"0 0 ${stageSize.width} ${stageSize.height}\">`);
    svgParts.push(`<rect x=\"0\" y=\"0\" width=\"${stageSize.width}\" height=\"${stageSize.height}\" fill=\"${bg}\"/>`);

    // Handle groups first
    const groups = Array.from(new Set(shapes.map((s) => s.groupId).filter(Boolean)));
    for (const gid of groups as (string | null)[]) {
      if (!gid) continue;
      const members = shapes.filter((s) => s.groupId === gid && s.visible !== false);
      svgParts.push(`<g data-group-id=\"${gid}\">`);
      for (const s of members) {
        const rot = s.rotation || 0;
        const transform = rot ? ` transform=\"rotate(${rot} ${s.x} ${s.y})\"` : "";
        const stroke = s.stroke ? ` stroke=\"${s.stroke}\" stroke-width=\"${s.strokeWidth || 1}\"` : "";
        const fill = s.fill ? ` fill=\"${s.fill}\"` : " fill=\"none\"";
        if (s.type === "rect") {
          const r = s as RectShape;
          svgParts.push(`<rect x=\"${r.x}\" y=\"${r.y}\" width=\"${r.width}\" height=\"${r.height}\" rx=\"${r.cornerRadius || 0}\"${fill}${stroke}${transform}/>`);
        } else if (s.type === "circle") {
          const c = s as CircleShape;
          svgParts.push(`<circle cx=\"${c.x}\" cy=\"${c.y}\" r=\"${c.radius}\"${fill}${stroke}${transform}/>`);
        } else if (s.type === "text") {
          const t = s as TextShape;
          svgParts.push(`<text x=\"${t.x}\" y=\"${t.y}\" font-size=\"${t.fontSize || 24}\" fill=\"${s.fill || "#0f172a"}\"${transform}>${esc(t.text)}</text>`);
        } else if (s.type === "line") {
          const l = s as LineShape;
          svgParts.push(`<polyline points=\"${l.points.join(",")}\" fill=\"none\" stroke=\"${s.stroke || "#000"}\" stroke-width=\"${s.strokeWidth || 1}\"${transform}/>\n`);
        } else if (s.type === "arrow") {
          const a = s as ArrowShape;
          svgParts.push(`<polyline points=\"${a.points.join(",")}\" fill=\"none\" stroke=\"${s.stroke || "#000"}\" stroke-width=\"${s.strokeWidth || 1}\" marker-end=\"url(#arrow)\"${transform}/>\n`);
        } else if (s.type === "image") {
          const im = s as ImageShape;
          const w = im.width || 300, h = im.height || 200;
          svgParts.push(`<image href=\"${im.src}\" x=\"${im.x}\" y=\"${im.y}\" width=\"${w}\" height=\"${h}\"${transform}/>\n`);
        }
      }
      svgParts.push(`</g>`);
    }

    // Render ungrouped shapes
    for (const s of shapes.filter((s) => !s.groupId && s.visible !== false)) {
      const rot = s.rotation || 0;
      const transform = rot ? ` transform=\"rotate(${rot} ${s.x} ${s.y})\"` : "";
      const stroke = s.stroke ? ` stroke=\"${s.stroke}\" stroke-width=\"${s.strokeWidth || 1}\"` : "";
      const fill = s.fill ? ` fill=\"${s.fill}\"` : " fill=\"none\"";
      if (s.type === "rect") {
        const r = s as RectShape;
        svgParts.push(`<rect x=\"${r.x}\" y=\"${r.y}\" width=\"${r.width}\" height=\"${r.height}\" rx=\"${r.cornerRadius || 0}\"${fill}${stroke}${transform}/>`);
      } else if (s.type === "circle") {
        const c = s as CircleShape;
        svgParts.push(`<circle cx=\"${c.x}\" cy=\"${c.y}\" r=\"${c.radius}\"${fill}${stroke}${transform}/>`);
      } else if (s.type === "text") {
        const t = s as TextShape;
        svgParts.push(`<text x=\"${t.x}\" y=\"${t.y}\" font-size=\"${t.fontSize || 24}\" fill=\"${s.fill || "#0f172a"}\"${transform}>${esc(t.text)}</text>`);
      } else if (s.type === "line") {
        const l = s as LineShape;
        svgParts.push(`<polyline points=\"${l.points.join(",")}\" fill=\"none\" stroke=\"${s.stroke || "#000"}\" stroke-width=\"${s.strokeWidth || 1}\"${transform}/>\n`);
      } else if (s.type === "arrow") {
        const a = s as ArrowShape;
        svgParts.push(`<polyline points=\"${a.points.join(",")}\" fill=\"none\" stroke=\"${s.stroke || "#000"}\" stroke-width=\"${s.strokeWidth || 1}\" marker-end=\"url(#arrow)\"${transform}/>\n`);
      } else if (s.type === "image") {
        const im = s as ImageShape;
        const w = im.width || 300, h = im.height || 200;
        svgParts.push(`<image href=\"${im.src}\" x=\"${im.x}\" y=\"${im.y}\" width=\"${w}\" height=\"${h}\"${transform}/>\n`);
      }
    }

    svgParts.push(`<defs><marker id=\"arrow\" orient=\"auto\" markerWidth=\"6\" markerHeight=\"6\" refX=\"1\" refY=\"2\"><path d=\"M0,0 L0,4 L4,2 z\" fill=\"#000\"/></marker></defs>`);
    for (const c of connectors) {
      svgParts.push(`<polyline points=\"${c.points.join(",")}\" fill=\"none\" stroke=\"${c.stroke || "#000"}\" stroke-width=\"${c.strokeWidth || 2}\" marker-end=\"url(#arrow)\"/>`);
    }
    svgParts.push(`</svg>`);
    const raw = svgParts.join("");
    const clean = sanitizeSvgString(raw);
    const blob = new Blob([clean], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    downloadURI(url, "figure.svg");
    URL.revokeObjectURL(url);
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
          setShapes(parsed.__shapes);
          setBg(parsed.__bg || "#ffffff");
          setStageSize(parsed.__size || { width: 1200, height: 800 });
          setConnectors(parsed.__connectors || []);
          if (parsed.__grid) {
            setShowGrid(!!parsed.__grid.showGrid);
            setGridSize(parsed.__grid.gridSize || 20);
            setSnapEnabled(!!parsed.__grid.snapEnabled);
          }
          // Reset history after load
          reset({ shapes: parsed.__shapes, connectors: parsed.__connectors || [], bg: parsed.__bg || "#ffffff", stageSize: parsed.__size || { width: 1200, height: 800 } });
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
          pushSnapshot({ shapes: next, connectors, bg, stageSize });
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
          pushSnapshot({ shapes: next, connectors, bg, stageSize });
          return next;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g" && selectedIds.length >= 2) {
        e.preventDefault();
        groupSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, gridSize, refreshConnectors]);

  const active = useMemo(() => (selectedIds.length === 1 ? shapes.find((s) => s.id === selectedIds[0]) || null : null), [shapes, selectedIds]);
  const updateActive = (k: string, v: any) => { if (!active) return; updateShape(active.id, { [k]: v } as any); refreshConnectors(shapes.map((sh) => (sh.id === active.id ? ({ ...sh, [k]: v } as AnyShape) : sh))); };

  // GROUP / UNGROUP
  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    const gid = uuidv4();
    const next = shapes.map((s) => selectedIds.includes(s.id) ? ({ ...s, groupId: gid } as AnyShape) : s);
    setShapes(next);
    setSelectedIds([gid]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };
  const ungroupSelected = () => {
    if (!selectedIds.length) return;
    const ids = selectedIds;
    const next = shapes.map((s) => (ids.includes(s.groupId || "") ? ({ ...s, groupId: null } as AnyShape) : s));
    setShapes(next);
    setSelectedIds([]);
    pushSnapshot({ shapes: next, connectors, bg, stageSize });
  };

  // Layers actions
  const toggleVisibility = (id: string) => {
    setShapes((s) => {
      const next = s.map((sh) => (sh.id === id ? ({ ...sh, visible: !(sh.visible !== false) } as AnyShape) : sh));
      pushSnapshot({ shapes: next, connectors, bg, stageSize });
      return next;
    });
  };
  const toggleLock = (id: string) => {
    setShapes((s) => {
      const next = s.map((sh) => (sh.id === id ? ({ ...sh, locked: !(sh.locked || false) } as AnyShape) : sh));
      pushSnapshot({ shapes: next, connectors, bg, stageSize });
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      {!acceptedRights && <RightsDialog onAcknowledge={(username) => { const ts = new Date().toISOString(); localStorage.setItem("figurelab_rights_ack", JSON.stringify({ user: username || "unknown", ts })); setAcceptedRights(true); const log = JSON.parse(localStorage.getItem("figurelab_rights_log" ) || "[]"); log.push({ user: username || "unknown", ts }); localStorage.setItem("figurelab_rights_log", JSON.stringify(log)); }} />}

      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <div className="font-semibold text-lg">Editable Figure Studio</div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={addRect} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Rectangle</button>
            <button onClick={addCircle} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Circle</button>
            <button onClick={addLine} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Line</button>
            <button onClick={addArrow} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Arrow</button>
            <button onClick={addText} className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm">Text</button>
            <label className="px-3 py-1.5 rounded-2xl bg-slate-900 text-white text-sm cursor-pointer">Upload Image<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageFromFile(f); }} /></label>

            <button onClick={bringForward} className="px-2 py-1.5 rounded-xl border text-sm">Bring Forward</button>
            <button onClick={sendBackward} className="px-2 py-1.5 rounded-xl border text-sm">Send Back</button>

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
              <button onClick={() => alignSelected("left")}
