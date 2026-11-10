/**
 * VIGILA Cloud Surveillance - Computer Vision & Motion Detection Engine
 * Performs real-time frame difference analysis on WebCam or Simulated Canvas,
 * extracts motion vectors, and triggers automated cloud security alerts.
 */

class MotionDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 28; // Pixel intensity change threshold
    this.minMotionPixels = options.minMotionPixels || 1500; // Minimum changed pixels to trigger alert
    this.prevImageData = null;
    this.lastTriggerTime = 0;
    this.cooldownMs = 6000; // 6 seconds between automated incident alerts
    this.onMotionEvent = options.onMotionEvent || null;
  }

  /**
   * Process a frame from a canvas or video element
   * @param {HTMLCanvasElement} canvas
   * @param {string} cameraId
   */
  processFrame(canvas, cameraId = 'CAM-01') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const w = canvas.width;
    const h = canvas.height;

    // Sample downscaled region for high performance
    const sampleW = 160;
    const sampleH = 90;

    let imgData;
    try {
      imgData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      // Security/tainted canvas protection
      return;
    }

    if (!this.prevImageData) {
      this.prevImageData = imgData;
      return;
    }

    const curr = imgData.data;
    const prev = this.prevImageData.data;
    let changedPixels = 0;
    let minX = w, maxX = 0, minY = h, maxY = 0;

    // Fast step analysis (sample every 8th pixel for speed)
    const step = 8;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const diffR = Math.abs(curr[i] - prev[i]);
        const diffG = Math.abs(curr[i + 1] - prev[i + 1]);
        const diffB = Math.abs(curr[i + 2] - prev[i + 2]);
        const diff = (diffR + diffG + diffB) / 3;

        if (diff > this.threshold) {
          changedPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    this.prevImageData = imgData;

    // If significant motion detected
    if (changedPixels > (this.minMotionPixels / (step * step))) {
      // Draw detection bounding box on live canvas
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      const boxW = Math.max(80, maxX - minX + 20);
      const boxH = Math.max(90, maxY - minY + 20);
      const boxX = Math.max(10, minX - 10);
      const boxY = Math.max(10, minY - 10);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Label
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(boxX, boxY - 22, 170, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`🚨 MOVIMIENTO [${Math.min(99, Math.round(75 + changedPixels * 0.1))}%]`, boxX + 6, boxY - 7);
      ctx.restore();

      // Trigger event if cooldown elapsed
      const now = Date.now();
      if (now - this.lastTriggerTime > this.cooldownMs) {
        this.lastTriggerTime = now;
        if (this.onMotionEvent) {
          this.onMotionEvent({
            cameraId,
            type: 'MOTION_DETECTED',
            severity: 'HIGH',
            confidence: `${Math.min(99, Math.round(82 + changedPixels * 0.1))}%`,
            description: `Movimiento anómalo detectado en tiempo real en ${cameraId}. Objeto en coordenadas (${Math.round(boxX)}, ${Math.round(boxY)}).`,
            box: { x: boxX, y: boxY, w: boxW, h: boxH }
          });
        }
      }
    }
  }
}

window.MotionDetector = MotionDetector;

