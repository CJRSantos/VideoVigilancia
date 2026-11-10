/**
 * VIGILA Cloud Surveillance - Professional CCTV Analytics & Overlay Engine
 * Renders military-grade computer vision HUD overlays (reticles, AI bounding boxes,
 * optical crosshairs, zone perimeters) over real surveillance video feeds.
 */

class CameraSimulator {
  constructor() {
    this.cameras = {
      'CAM-01': { ptzX: 0, ptzY: 0, zoom: 1.0, isWebcam: false, isCustomLocal: false },
      'CAM-02': { ptzX: 0, ptzY: 0, zoom: 1.0, isCustomLocal: false },
      'CAM-03': { ptzX: 0, ptzY: 0, zoom: 1.0, isCustomLocal: false },
      'CAM-04': { ptzX: 0, ptzY: 0, zoom: 1.0, isCustomLocal: false },
      'CAM-05': { ptzX: 0, ptzY: 0, zoom: 1.0, isCustomLocal: false },
      'CAM-06': { ptzX: 0, ptzY: 0, zoom: 1.0, isCustomLocal: false }
    };
    this.animationFrameId = null;
  }

  init() {
    this.startRenderingLoop();
  }

  startRenderingLoop() {
    const loop = (timestamp) => {
      this.renderOverlays(timestamp);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  renderOverlays(timestamp) {
    for (let i = 1; i <= 6; i++) {
      const camId = `CAM-0${i}`;
      this.renderCameraHUD(camId, timestamp);
    }
  }

  /**
   * Draws tactical CCTV overlays, corner reticles and AI bounding boxes
   */
  renderCameraHUD(camId, time) {
    const num = camId.split('-')[1];
    const canvas = document.getElementById(`canvas-cam-${num}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Clear previous overlay
    ctx.clearRect(0, 0, w, h);

    // 1. Tactical Corner Target Reticles (Real military/CCTV camera OSD)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    const cornerSize = 16;
    const pad = 24;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(w - pad - cornerSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(pad, h - pad - cornerSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + cornerSize, h - pad);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(w - pad - cornerSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - cornerSize);
    ctx.stroke();

    // 2. Optical Center Crosshair
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, h / 2); ctx.lineTo(w / 2 + 12, h / 2);
    ctx.moveTo(w / 2, h / 2 - 12); ctx.lineTo(w / 2, h / 2 + 12);
    ctx.stroke();

    // 3. Dynamic AI Object Detection Bounding Boxes
    this.drawAIBoundingBoxes(ctx, camId, w, h, time);
  }

  drawAIBoundingBoxes(ctx, camId, w, h, time) {
    if (camId === 'CAM-01') {
      // Entry Pedestrian AI Tracker
      const t = time * 0.0008;
      const x = (w * 0.32) + Math.sin(t) * 35;
      const y = (h * 0.28) + Math.cos(t * 1.5) * 15;
      this.drawBox(ctx, x, y, 75, 140, 'PERSONA #104 [96.2%]', '#10b981');
    } else if (camId === 'CAM-02') {
      // Datacenter Corridor Authorized Staff
      const t = time * 0.0006;
      const x = (w * 0.45) + Math.sin(t * 1.2) * 50;
      const y = (h * 0.32) + Math.cos(t) * 10;
      this.drawBox(ctx, x, y, 65, 130, 'ING. SISTEMAS [97.8%]', '#06b6d4');
    } else if (camId === 'CAM-03') {
      // Commercial Lobby Visitors
      const t = time * 0.0007;
      const x1 = (w * 0.25) + Math.cos(t) * 30;
      const y1 = (h * 0.35);
      this.drawBox(ctx, x1, y1, 60, 120, 'CLIENTE #88 [94.5%]', '#38bdf8');

      const x2 = (w * 0.65) + Math.sin(t * 1.3) * 40;
      const y2 = (h * 0.30);
      this.drawBox(ctx, x2, y2, 65, 125, 'EMPLEADO #12 [98.1%]', '#10b981');
    } else if (camId === 'CAM-04') {
      // Highway / Parking Vehicle Tracker
      const t = time * 0.001;
      const vx = (w * 0.38) + Math.sin(t * 2) * 60;
      const vy = (h * 0.40) + Math.cos(t) * 20;
      this.drawBox(ctx, vx, vy, 140, 95, 'VEHICULO: SEDAN [93.4%]', '#f59e0b');
    } else if (camId === 'CAM-05') {
      // Perimeter Gate Tripwire & Object
      const t = time * 0.0009;
      const px = (w * 0.40) + Math.sin(t) * 70;
      const py = (h * 0.35);
      this.drawBox(ctx, px, py, 70, 135, 'PATRULLERO [95.0%]', '#10b981');

      // Security Tripwire line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(20, h * 0.75);
      ctx.lineTo(w - 20, h * 0.75);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.font = '9px monospace';
      ctx.fillText('LINEA DE TRIPWIRE VIRTUAL - ZONA 05', 25, h * 0.75 - 6);
    } else if (camId === 'CAM-06') {
      // Logistics Warehouse
      const t = time * 0.0005;
      const lx = (w * 0.50) + Math.cos(t) * 45;
      const ly = (h * 0.35);
      this.drawBox(ctx, lx, ly, 80, 130, 'OPERARIO ALMACEN [94.1%]', '#38bdf8');
    }
  }

  drawBox(ctx, x, y, width, height, label, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const len = 12;
    // Corners
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x + width - len, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + len);
    ctx.moveTo(x, y + height - len); ctx.lineTo(x, y + height); ctx.lineTo(x + len, y + height);
    ctx.moveTo(x + width - len, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - len);
    ctx.stroke();

    // Box label
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 18, Math.max(110, ctx.measureText(label).width + 12), 18);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(label, x + 4, y - 5);
    ctx.restore();
  }

  // Update PTZ on real video element and canvas
  setPTZ(camId, { dx = 0, dy = 0, dZoom = 0, reset = false }) {
    if (!this.cameras[camId]) return;
    const cam = this.cameras[camId];
    if (reset) {
      cam.ptzX = 0;
      cam.ptzY = 0;
      cam.zoom = 1.0;
    } else {
      cam.ptzX = Math.max(-100, Math.min(100, cam.ptzX + dx));
      cam.ptzY = Math.max(-60, Math.min(60, cam.ptzY + dy));
      cam.zoom = Math.max(1.0, Math.min(3.5, cam.zoom + dZoom));
    }

    const num = camId.split('-')[1];
    const video = document.getElementById(`video-stream-cam-${num}`);
    const canvas = document.getElementById(`canvas-cam-${num}`);

    const transformStr = `scale(${cam.zoom}) translate(${cam.ptzX}px, ${cam.ptzY}px)`;
    if (video) video.style.transform = transformStr;
    if (canvas) canvas.style.transform = transformStr;

    return { ...cam };
  }
}

window.CameraSimulator = CameraSimulator;
