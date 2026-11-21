'use strict';

/**
 * 🎨 ओळखा पाहू! 👀 – Draw & Guess Battle
 * Responsive High-DPI Drawing Engine with Normalized Coordinates & Touchscreen Optimization
 */

class DrawingCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    
    // Mode
    this.isInteractive = false; // true if current player is the drawer
    this.isDrawing = false;
    this.activePointerId = null;

    // Tool settings
    this.tool = 'brush'; // 'pencil' | 'brush' | 'marker' | 'eraser'
    this.color = '#1E293B'; // Default dark slate
    this.baseSize = 8; // in CSS pixels relative to standard 400px width

    // Stroke history
    this.strokes = []; // Array of { id, tool, color, sizeRatio, points: [[nx, ny], ...] }
    this.currentStroke = null;
    this.undoStack = [];

    // Callbacks for Socket.IO
    this.onStrokeStart = null;
    this.onStrokePoint = null;
    this.onStrokeEnd = null;
    this.onUndo = null;
    this.onRedo = null;
    this.onClear = null;

    // Attach listeners
    this.initListeners();
    this.resize();

    // Listen to window resize / orientation change
    window.addEventListener('resize', () => {
      if (!this.isDrawing) this.resize();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => { if (!this.isDrawing) this.resize(); }, 150);
    });

    // Dynamic layout observer for mobile viewports
    if (typeof ResizeObserver !== 'undefined') {
      const parentEl = this.canvas.parentElement || this.canvas;
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isDrawing) this.resize();
      });
      this.resizeObserver.observe(parentEl);
    }
  }

  setInteractive(canDraw) {
    this.isInteractive = Boolean(canDraw);
    this.canvas.style.cursor = this.isInteractive ? 'crosshair' : 'default';
  }

  setTool(tool) {
    this.tool = tool;
  }

  setColor(color) {
    this.color = color;
    if (this.tool === 'eraser') {
      this.tool = 'brush';
    }
  }

  setSize(sizePx) {
    this.baseSize = sizePx;
  }

  resize() {
    if (this.isDrawing) return; // Prevent clearing mid-stroke

    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    // Only re-allocate canvas backing buffer if size actually changed
    if (Math.abs(this.canvas.width - targetWidth) <= 1 && Math.abs(this.canvas.height - targetHeight) <= 1) {
      return;
    }

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // Reset transform & scale for DPR
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // Redraw all strokes from normalized history
    this.redrawAll();
  }

  getPointFromEvent(e) {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }

  getNormalizedPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const { clientX, clientY } = this.getPointFromEvent(e);
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return [
      Number((x / rect.width).toFixed(4)),
      Number((y / rect.height).toFixed(4))
    ];
  }

  initListeners() {
    this.canvas.style.touchAction = 'none';

    // 1. Pointer Events
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.isInteractive || !e.isPrimary) return;
      e.preventDefault();
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this.activePointerId = e.pointerId;
      this.startDrawing(e);
    }, { passive: false });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isInteractive || !this.isDrawing) return;
      if (e.pointerId !== this.activePointerId) return;
      e.preventDefault();
      this.continueDrawing(e);
    }, { passive: false });

    const stopPointer = (e) => {
      if (!this.isDrawing || e.pointerId !== this.activePointerId) return;
      e.preventDefault();
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      this.stopDrawing();
    };

    this.canvas.addEventListener('pointerup', stopPointer, { passive: false });
    this.canvas.addEventListener('pointercancel', stopPointer, { passive: false });

    // 2. Direct Touch Event Fallback for Android Chrome
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.isInteractive) return;
      e.preventDefault();
      if (!this.isDrawing) {
        this.startDrawing(e);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isInteractive || !this.isDrawing) return;
      e.preventDefault();
      this.continueDrawing(e);
    }, { passive: false });

    const stopTouch = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.stopDrawing();
    };

    this.canvas.addEventListener('touchend', stopTouch, { passive: false });
    this.canvas.addEventListener('touchcancel', stopTouch, { passive: false });
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const pt = this.getNormalizedPoint(e);

    const sizeRatio = Number((this.baseSize / Math.max(300, rect.width)).toFixed(5));
    const strokeColor = this.tool === 'eraser' ? '#FFFFFF' : this.color;

    this.currentStroke = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      tool: this.tool,
      color: strokeColor,
      sizeRatio,
      points: [pt]
    };

    this.strokes.push(this.currentStroke);
    this.undoStack = [];

    // Draw initial dot
    this.drawSegment(this.currentStroke, pt, pt);

    if (this.onStrokeStart) {
      this.onStrokeStart({
        id: this.currentStroke.id,
        tool: this.tool,
        color: strokeColor,
        sizeRatio,
        point: pt
      });
    }
  }

  continueDrawing(e) {
    if (!this.currentStroke) return;
    const pt = this.getNormalizedPoint(e);
    const pts = this.currentStroke.points;
    const prev = pts[pts.length - 1];

    // Filter tiny micro-jitters
    if (Math.abs(pt[0] - prev[0]) < 0.0008 && Math.abs(pt[1] - prev[1]) < 0.0008) return;

    pts.push(pt);
    this.drawSegment(this.currentStroke, prev, pt);

    if (this.onStrokePoint) {
      this.onStrokePoint(this.currentStroke.id, pt);
    }
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.activePointerId = null;

    if (this.currentStroke && this.onStrokeEnd) {
      this.onStrokeEnd(this.currentStroke.id);
    }
    this.currentStroke = null;
  }

  drawSegment(stroke, p1, p2) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const x1 = p1[0] * w;
    const y1 = p1[1] * h;
    const x2 = p2[0] * w;
    const y2 = p2[1] * h;
    const lineWidth = Math.max(2, stroke.sizeRatio * w);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.fillStyle = stroke.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (p1 === p2 || (Math.abs(x1 - x2) < 0.5 && Math.abs(y1 - y2) < 0.5)) {
      this.ctx.arc(x1, y1, lineWidth / 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  redrawAll() {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Clear background to clean soft white
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.restore();

    // Replay all strokes
    for (const stroke of this.strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      const pts = stroke.points;
      const lineWidth = Math.max(2, stroke.sizeRatio * w);

      this.ctx.save();
      this.ctx.strokeStyle = stroke.color;
      this.ctx.fillStyle = stroke.color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (pts.length === 1) {
        this.ctx.beginPath();
        this.ctx.arc(pts[0][0] * w, pts[0][1] * h, lineWidth / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(pts[0][0] * w, pts[0][1] * h);

        // Smooth quadratic curves between midpoints
        for (let i = 1; i < pts.length; i++) {
          const xc = ((pts[i - 1][0] + pts[i][0]) / 2) * w;
          const yc = ((pts[i - 1][1] + pts[i][1]) / 2) * h;
          this.ctx.quadraticCurveTo(pts[i - 1][0] * w, pts[i - 1][1] * h, xc, yc);
        }
        const last = pts[pts.length - 1];
        this.ctx.lineTo(last[0] * w, last[1] * h);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  // --- Remote actions from other players ---
  renderRemoteStrokeStart(data) {
    const stroke = {
      id: data.id,
      tool: data.tool,
      color: data.color,
      sizeRatio: data.sizeRatio,
      points: [data.point]
    };
    this.strokes.push(stroke);
    this.drawSegment(stroke, data.point, data.point);
  }

  renderRemoteStrokePoint(data) {
    const stroke = this.strokes.find(s => s.id === data.strokeId);
    if (!stroke) return;
    const prev = stroke.points[stroke.points.length - 1];
    stroke.points.push(data.point);
    this.drawSegment(stroke, prev, data.point);
  }

  renderRemoteStrokeEnd(data) {
    // Redraw with full smoothing once stroke ends
    this.redrawAll();
  }

  undo() {
    if (this.strokes.length === 0) return;
    const popped = this.strokes.pop();
    this.undoStack.push(popped);
    this.redrawAll();
    if (this.onUndo) this.onUndo(popped.id);
  }

  redo() {
    if (this.undoStack.length === 0) return;
    const restored = this.undoStack.pop();
    this.strokes.push(restored);
    this.redrawAll();
    if (this.onRedo) this.onRedo(restored);
  }

  clear(broadcast = true) {
    this.strokes = [];
    this.undoStack = [];
    this.redrawAll();
    if (broadcast && this.onClear) this.onClear();
  }

  applyRemoteUndo(strokeId) {
    this.strokes = this.strokes.filter(s => s.id !== strokeId);
    this.redrawAll();
  }

  applyRemoteRedo(stroke) {
    if (stroke) {
      this.strokes.push(stroke);
      this.redrawAll();
    }
  }

  syncAllStrokes(strokesList) {
    this.strokes = Array.isArray(strokesList) ? strokesList : [];
    this.redrawAll();
  }
}

window.DrawingCanvas = DrawingCanvas;
