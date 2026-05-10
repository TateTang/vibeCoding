import { useCallback, useEffect, useRef, useState } from "react";

const CHALK_COLORS = [
  { id: "white", label: "白", value: "#f4f4f0" },
  { id: "yellow", label: "黄", value: "#fde047" },
  { id: "pink", label: "粉", value: "#fda4af" },
  { id: "blue", label: "蓝", value: "#7dd3fc" },
];

function drawBoardBackground(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1f5c4a");
  g.addColorStop(0.45, "#174030");
  g.addColorStop(1, "#0d261f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 120; i++) {
    const x = (Math.sin(i * 12.9898) * 0.5 + 0.5) * w;
    const y = (Math.cos(i * 78.233) * 0.5 + 0.5) * h;
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = Math.max(1, w * 0.001);
  for (let x = 0; x < w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

function getDevicePoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * sx,
    y: (event.clientY - rect.top) * sy,
    scale: (sx + sy) / 2,
  };
}

export default function ElectronicBlackboard() {
  const wrapRef = useRef(null);
  const bgRef = useRef(null);
  const fgRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(CHALK_COLORS[0].value);
  const [lineWidth, setLineWidth] = useState(5);

  const resizeCanvases = useCallback(() => {
    const wrap = wrapRef.current;
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!wrap || !bg || !fg) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(width * dpr));
    const h = Math.max(1, Math.floor(height * dpr));

    bg.width = w;
    bg.height = h;
    fg.width = w;
    fg.height = h;
    bg.style.width = `${width}px`;
    bg.style.height = `${height}px`;
    fg.style.width = `${width}px`;
    fg.style.height = `${height}px`;

    const bctx = bg.getContext("2d");
    drawBoardBackground(bctx, w, h);

    const fctx = fg.getContext("2d");
    fctx.clearRect(0, 0, w, h);
  }, []);

  useEffect(() => {
    resizeCanvases();
    const el = wrapRef.current;
    if (!el) {
      return undefined;
    }
    const ro = new ResizeObserver(() => resizeCanvases());
    ro.observe(el);
    return () => ro.disconnect();
  }, [resizeCanvases]);

  const handlePointerDown = (event) => {
    const fg = fgRef.current;
    if (!fg) {
      return;
    }
    event.preventDefault();
    fg.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getDevicePoint(event, fg);
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current) {
      return;
    }
    const fg = fgRef.current;
    if (!fg) {
      return;
    }
    event.preventDefault();
    const ctx = fg.getContext("2d");
    const cur = getDevicePoint(event, fg);
    const last = lastPointRef.current;
    if (!last) {
      lastPointRef.current = cur;
      return;
    }

    const lw = lineWidth * cur.scale;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = lw * 2.2;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
    }

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = cur;
  };

  const endStroke = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearInk = () => {
    const fg = fgRef.current;
    if (!fg) {
      return;
    }
    const ctx = fg.getContext("2d");
    ctx.clearRect(0, 0, fg.width, fg.height);
  };

  const exportPng = () => {
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!bg || !fg) {
      return;
    }
    const out = document.createElement("canvas");
    out.width = bg.width;
    out.height = bg.height;
    const octx = out.getContext("2d");
    octx.drawImage(bg, 0, 0);
    octx.drawImage(fg, 0, 0);

    const url = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `电子黑板-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
    a.rel = "noopener";
    a.click();
  };

  return (
    <section className="blackboard-panel card">
      <div className="blackboard-toolbar">
        <div className="blackboard-toolbar-group">
          <span className="blackboard-toolbar-label">工具</span>
          <button
            type="button"
            className={`blackboard-tool ${tool === "pen" ? "is-active" : ""}`}
            onClick={() => setTool("pen")}
          >
            粉笔
          </button>
          <button
            type="button"
            className={`blackboard-tool ${tool === "erase" ? "is-active" : ""}`}
            onClick={() => setTool("erase")}
          >
            橡皮
          </button>
        </div>

        <div className="blackboard-toolbar-group">
          <span className="blackboard-toolbar-label">颜色</span>
          {CHALK_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`blackboard-swatch ${color === c.value ? "is-active" : ""}`}
              style={{ "--swatch": c.value }}
              title={c.label}
              onClick={() => {
                setTool("pen");
                setColor(c.value);
              }}
              aria-label={`粉笔颜色 ${c.label}`}
            />
          ))}
        </div>

        <div className="blackboard-toolbar-group blackboard-toolbar-group--grow">
          <span className="blackboard-toolbar-label">粗细</span>
          <input
            type="range"
            min={2}
            max={28}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            aria-label="粉笔粗细"
          />
          <span className="blackboard-width-value">{lineWidth}px</span>
        </div>

        <div className="blackboard-toolbar-actions">
          <button type="button" className="ghost-btn" onClick={clearInk}>
            清空画迹
          </button>
          <button type="button" className="primary-btn" onClick={exportPng}>
            导出 PNG
          </button>
        </div>
      </div>

      <p className="blackboard-hint">在绿色板面上拖拽绘制；支持触控与鼠标。导出将包含仿真黑板背景与笔迹。</p>

      <div
        ref={wrapRef}
        className="blackboard-canvas-wrap"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      >
        <canvas ref={bgRef} className="blackboard-canvas blackboard-canvas--bg" aria-hidden="true" />
        <canvas ref={fgRef} className="blackboard-canvas blackboard-canvas--fg" />
      </div>
    </section>
  );
}
