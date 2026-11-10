/**
 * VIGILA Cloud Surveillance - Core Application Controller
 * Handles Real Video streams, Local Video Uploads (Drag & Drop + File Picker),
 * Webcam integration, PTZ, Snapshots, and AWS Architecture Simulators.
 */

class VigilaApp {
  constructor() {
    this.activeCameraId = 'CAM-01';
    this.webcamStream = null;
    this.isWebcamActive = false;
    this.cameraSim = null;
    this.motionDetector = null;
    this.costCalc = null;
    this.ssmSim = null;
    this.audioCtx = null;
    this.currentRole = 'OPERATOR';
    this.incidents = [];
    this.evidenceList = [];
    this.availableVideos = [];
    this.modalSelectedFile = null;
    this.modalSelectedPreset = null;
  }

  async init() {
    this.initClock();
    this.initAudioContext();
    this.initTabs();
    this.initLayoutControls();
    this.initCameraSelection();
    this.initPTZControls();
    this.initSnapshots();
    this.initIRFilters();
    this.initRoleSelector();
    this.initFullscreen();
    this.initAlarmSimulation();

    // Local Video Upload & Drag-and-Drop Features
    this.initLocalVideoUpload();
    this.initDragAndDrop();
    this.initVideoModal();

    // Sub-modules
    this.cameraSim = new CameraSimulator();
    this.cameraSim.init();

    this.motionDetector = new MotionDetector({
      onMotionEvent: (evt) => this.handleMotionIncident(evt)
    });

    this.costCalc = new CostCalculator();
    this.costCalc.init();

    this.ssmSim = new SSMSimulator();
    this.ssmSim.init();

    // Hook up Webcam button
    const btnWebcam = document.getElementById('btn-toggle-webcam');
    if (btnWebcam) {
      btnWebcam.addEventListener('click', () => this.toggleWebcam());
    }

    // Load initial data
    await this.fetchIncidents();
    await this.fetchEvidence();
    await this.fetchAvailableVideos();

    // Auto-play all video feeds to ensure no browser pause blocks them
    this.ensureVideosPlaying();
  }

  ensureVideosPlaying() {
    for (let i = 1; i <= 6; i++) {
      const v = document.getElementById(`video-stream-cam-0${i}`);
      if (v) {
        v.play().catch(err => {
          // Autoplay policy might need first interaction
          console.log(`Auto-play CAM-0${i} deferred:`, err.message);
        });
      }
    }
  }

  // Live Clock Updater
  initClock() {
    const clockEl = document.getElementById('live-clock');
    const updateTime = () => {
      const now = new Date();
      const str = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC-5';
      if (clockEl) clockEl.textContent = str;

      for (let i = 1; i <= 6; i++) {
        const wm = document.getElementById(`watermark-cam-0${i}`);
        if (wm) {
          const ms = String(now.getMilliseconds()).padStart(3, '0');
          wm.textContent = `${str.substring(0, 19)}.${ms}`;
        }
      }
    };
    updateTime();
    setInterval(updateTime, 60);
  }

  // Web Audio Alert Synthesizer
  initAudioContext() {
    const initAudio = () => {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
  }

  playAlarmSound() {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';

      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.40);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio synth not allowed yet:', e);
    }
  }

  // Navigation Tabs
  initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const panel = document.getElementById(targetId);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // Camera Grid Layouts
  initLayoutControls() {
    const btns = document.querySelectorAll('.btn-layout');
    const container = document.getElementById('cameras-grid-container');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const layout = btn.getAttribute('data-layout');
        container.className = `cameras-grid ${layout}`;

        if (layout === 'grid-1') {
          document.querySelectorAll('.camera-card').forEach(card => {
            if (card.getAttribute('data-camera-id') === this.activeCameraId) {
              card.classList.add('focused');
            } else {
              card.classList.remove('focused');
            }
          });
        }
      });
    });
  }

  // Camera Card Selection
  initCameraSelection() {
    const cards = document.querySelectorAll('.camera-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cam-tool-btn') || e.target.closest('.btn-cam-upload') || e.target.closest('input')) return;

        cards.forEach(c => c.classList.remove('selected-card'));
        card.classList.add('selected-card');

        this.activeCameraId = card.getAttribute('data-camera-id');
        const ptzActiveTag = document.getElementById('ptz-active-cam');
        if (ptzActiveTag) ptzActiveTag.textContent = this.activeCameraId;

        const container = document.getElementById('cameras-grid-container');
        if (container.classList.contains('grid-1')) {
          cards.forEach(c => c.classList.remove('focused'));
          card.classList.add('focused');
        }
      });
    });
  }

  // PTZ Joystick & Zoom Controls
  initPTZControls() {
    const ptzBtns = document.querySelectorAll('.ptz-btn');
    ptzBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-ptz');
        let dx = 0, dy = 0, reset = false;
        if (dir === 'up') dy = -25;
        if (dir === 'down') dy = 25;
        if (dir === 'left') dx = -25;
        if (dir === 'right') dx = 25;
        if (dir === 'center') reset = true;

        if (this.cameraSim) {
          this.cameraSim.setPTZ(this.activeCameraId, { dx, dy, reset });
        }
      });
    });

    const zoomBtns = document.querySelectorAll('.btn-zoom');
    zoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-zoom');
        const dZoom = type === 'in' ? 0.3 : -0.3;
        if (this.cameraSim) {
          const res = this.cameraSim.setPTZ(this.activeCameraId, { dZoom });
          const zoomLabel = document.getElementById('ptz-zoom-level');
          if (zoomLabel && res) zoomLabel.textContent = `${res.zoom.toFixed(1)}x`;
        }
      });
    });
  }

  // ========================================================
  // LOCAL VIDEO UPLOAD & DRAG-AND-DROP SYSTEM
  // ========================================================

  initLocalVideoUpload() {
    // Buttons on camera headers
    const uploadBtns = document.querySelectorAll('.btn-cam-upload, .btn-change-video');
    uploadBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const camId = btn.getAttribute('data-cam');
        const num = camId.split('-')[1];
        const fileInput = document.getElementById(`file-input-cam-${num}`);
        if (fileInput) fileInput.click();
      });
    });

    // File inputs on camera cards
    const fileInputs = document.querySelectorAll('.camera-file-input');
    fileInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const camId = input.getAttribute('data-cam');
        const file = e.target.files[0];
        if (file) {
          this.loadLocalVideoIntoCamera(camId, file);
        }
      });
    });
  }

  initDragAndDrop() {
    const cards = document.querySelectorAll('.camera-card');
    cards.forEach(card => {
      const camId = card.getAttribute('data-camera-id');

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('video/') || /\.(mp4|webm|mkv|mov|avi)$/i.test(file.name)) {
            this.loadLocalVideoIntoCamera(camId, file);
          } else {
            this.showToast('Por favor suelta un archivo de video válido (.mp4, .webm, .mkv)', 'alarm');
          }
        }
      });
    });
  }

  // Loads any user-chosen local video file into the requested camera
  loadLocalVideoIntoCamera(camId, file) {
    const num = camId.split('-')[1];
    const video = document.getElementById(`video-stream-cam-${num}`);
    if (!video) return;

    // Instant local blob playback
    const blobUrl = URL.createObjectURL(file);
    video.src = blobUrl;
    video.muted = true;
    video.loop = true;
    video.play().then(() => {
      this.showToast(`Video local "${file.name}" cargado con éxito en ${camId}`, 'success');
    }).catch(err => {
      console.warn('Play error:', err);
    });

    // Update camera header UI
    const badge = document.getElementById(`badge-cam-${num}`);
    if (badge) badge.textContent = `${camId} (LOCAL)`;

    const nameEl = document.getElementById(`name-cam-${num}`);
    if (nameEl) nameEl.textContent = `Archivo: ${file.name}`;

    // Mark as custom in simulator
    if (this.cameraSim && this.cameraSim.cameras[camId]) {
      this.cameraSim.cameras[camId].isCustomLocal = true;
    }

    // Optional background persistence upload to server
    this.uploadVideoToServer(file, camId);
  }

  async uploadVideoToServer(file, camId) {
    if (file.size > 80 * 1024 * 1024) {
      console.log('Video local muy grande para subida en background, reproduciendo localmente vía Blob.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        await fetch('/api/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            base64Data: base64Data,
            cameraId: camId
          })
        });
        await this.fetchAvailableVideos();
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.warn('Background upload skipped:', e);
    }
  }

  // Global Video Modal
  initVideoModal() {
    const modal = document.getElementById('upload-video-modal');
    const btnOpen = document.getElementById('btn-open-upload-modal');
    const btnClose = document.getElementById('btn-close-upload-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const btnApply = document.getElementById('btn-apply-modal-video');
    const fileInput = document.getElementById('modal-video-file-input');
    const fileNameDisplay = document.getElementById('modal-file-selected-name');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        this.renderPresetVideos();
      });
    }

    const closeModal = () => {
      modal.style.display = 'none';
      this.modalSelectedFile = null;
      this.modalSelectedPreset = null;
      if (fileNameDisplay) fileNameDisplay.textContent = 'Haz clic para examinar archivos o arrastra tu video aquí';
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.modalSelectedFile = e.target.files[0];
          this.modalSelectedPreset = null;
          if (fileNameDisplay) fileNameDisplay.textContent = `Archivo seleccionado: ${this.modalSelectedFile.name} (${(this.modalSelectedFile.size / 1024 / 1024).toFixed(1)} MB)`;
          document.querySelectorAll('.preset-video-item').forEach(i => i.classList.remove('selected'));
        }
      });
    }

    if (btnApply) {
      btnApply.addEventListener('click', () => {
        const targetCam = document.getElementById('modal-target-cam').value;
        const num = targetCam.split('-')[1];
        const video = document.getElementById(`video-stream-cam-${num}`);

        if (this.modalSelectedFile) {
          this.loadLocalVideoIntoCamera(targetCam, this.modalSelectedFile);
          closeModal();
        } else if (this.modalSelectedPreset && video) {
          video.src = this.modalSelectedPreset.url;
          video.play();
          this.showToast(`Cámara ${targetCam} configurada con ${this.modalSelectedPreset.name}`, 'success');
          closeModal();
        } else {
          this.showToast('Por favor selecciona un video local o un video de muestra', 'alarm');
        }
      });
    }
  }

  async fetchAvailableVideos() {
    try {
      const res = await fetch('/api/videos');
      this.availableVideos = await res.json();
    } catch (e) {
      console.warn('No se pudieron obtener videos disponibles:', e);
    }
  }

  renderPresetVideos() {
    const list = document.getElementById('preset-videos-list');
    if (!list) return;

    if (!this.availableVideos || this.availableVideos.length === 0) {
      list.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem;">No hay videos en el servidor. Sube uno local arriba.</span>`;
      return;
    }

    list.innerHTML = this.availableVideos.map(v => `
      <div class="preset-video-item" data-url="${v.url}" data-name="${v.name}">
        <div>
          <strong>${v.name}</strong>
          <small style="color:var(--text-muted);">${v.sizeMB} MB</small>
        </div>
        <span style="color:var(--accent-blue);">Elegir</span>
      </div>
    `).join('');

    list.querySelectorAll('.preset-video-item').forEach(item => {
      item.addEventListener('click', () => {
        list.querySelectorAll('.preset-video-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.modalSelectedPreset = {
          name: item.getAttribute('data-name'),
          url: item.getAttribute('data-url')
        };
        this.modalSelectedFile = null;
        const fileNameDisplay = document.getElementById('modal-file-selected-name');
        if (fileNameDisplay) fileNameDisplay.textContent = `Seleccionado preset: ${this.modalSelectedPreset.name}`;
      });
    });
  }

  // Webcam Integration (CAM 01)
  async toggleWebcam() {
    const webcamVideo = document.getElementById('webcam-video-element');
    const loopVideo = document.getElementById('video-stream-cam-01');
    const btn = document.getElementById('btn-toggle-webcam');

    if (this.isWebcamActive) {
      if (this.webcamStream) {
        this.webcamStream.getTracks().forEach(track => track.stop());
      }
      this.isWebcamActive = false;
      if (webcamVideo) webcamVideo.style.display = 'none';
      if (loopVideo) loopVideo.style.display = 'block';
      if (btn) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg><span>Conectar Mi Cámara Web (Cam 01)</span>`;
      }
      this.showToast('Cámara Web desconectada. Volviendo a transmisión grabada.', 'info');
      return;
    }

    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      webcamVideo.srcObject = this.webcamStream;
      await webcamVideo.play();

      this.isWebcamActive = true;
      if (loopVideo) loopVideo.style.display = 'none';
      if (webcamVideo) webcamVideo.style.display = 'block';
      if (btn) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8" fill="#ef4444"></circle></svg><span>Desconectar Cámara Web</span>`;
      }
      this.showToast('¡Cámara Web conectada exitosamente en CAM-01!', 'success');
    } catch (err) {
      console.warn('Webcam error:', err);
      this.showToast('No se pudo acceder a la webcam. Verificando permisos en el navegador.', 'alarm');
    }
  }

  // IR Night Vision Filter
  initIRFilters() {
    const irBtns = document.querySelectorAll('.btn-ir');
    irBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const camId = btn.getAttribute('data-cam');
        const num = camId.split('-')[1];
        const video = document.getElementById(`video-stream-cam-${num}`);
        const webcam = document.getElementById('webcam-video-element');

        if (video) video.classList.toggle('ir-filter');
        if (webcam && camId === 'CAM-01') webcam.classList.toggle('ir-filter');
        btn.classList.toggle('active');

        const isActive = video ? video.classList.contains('ir-filter') : false;
        this.showToast(`Modo Infrarrojo (Visión Nocturna) ${isActive ? 'ACTIVADO' : 'DESACTIVADO'} en ${camId}`, 'info');
      });
    });
  }

  // Forensic Snapshots from Real Video
  initSnapshots() {
    const snapBtns = document.querySelectorAll('.btn-snapshot');
    snapBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const camId = btn.getAttribute('data-cam');
        await this.takeSnapshot(camId);
      });
    });
  }

  async takeSnapshot(camId) {
    const num = camId.split('-')[1];
    let sourceElement = document.getElementById(`video-stream-cam-${num}`);
    if (camId === 'CAM-01' && this.isWebcamActive) {
      sourceElement = document.getElementById('webcam-video-element');
    }
    if (!sourceElement) return;

    // Create offscreen canvas for capture
    const offscreen = document.createElement('canvas');
    offscreen.width = sourceElement.videoWidth || 1280;
    offscreen.height = sourceElement.videoHeight || 720;
    const ctx = offscreen.getContext('2d');

    // Draw video frame
    ctx.drawImage(sourceElement, 0, 0, offscreen.width, offscreen.height);

    // Forensic Watermark Header & Footer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, offscreen.height - 40, offscreen.width, 40);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    const timeStr = new Date().toISOString();
    ctx.fillText(`VIGILA FORENSIC EVIDENCE | ${camId} | ${timeStr} | AES-256 / SHA-256 VERIFIED`, 20, offscreen.height - 15);

    const dataUrl = offscreen.toDataURL('image/jpeg', 0.92);

    try {
      const res = await fetch('/api/evidence/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraId: camId,
          dataUrl: dataUrl,
          label: `Captura Forense ${camId}`,
          notes: `Evidencia de video capturada por ${this.currentRole}`
        })
      });
      const item = await res.json();
      this.evidenceList.unshift(item);
      this.renderEvidence();
      this.showToast(`Evidencia ${item.id} guardada en bóveda S3 Glacier`, 'success');
    } catch (err) {
      console.error('Error guardando evidencia:', err);
    }
  }

  // Intruder Alarm Simulation
  initAlarmSimulation() {
    const btnAlarm = document.getElementById('btn-trigger-alarm-test');
    if (btnAlarm) {
      btnAlarm.addEventListener('click', () => {
        const randomCams = ['CAM-05', 'CAM-04', 'CAM-02', 'CAM-01'];
        const chosen = randomCams[Math.floor(Math.random() * randomCams.length)];

        this.handleMotionIncident({
          cameraId: chosen,
          type: 'INTRUSION_ALERT',
          severity: 'HIGH',
          confidence: '98.7%',
          description: `Intrusión de alta prioridad detectada en zona restringida (${chosen}). Se activó protocolo de seguridad.`
        });
      });
    }
  }

  async handleMotionIncident(evt) {
    this.playAlarmSound();

    const card = document.getElementById(`card-${evt.cameraId.toLowerCase()}`);
    if (card) {
      card.classList.add('alarm-state');
      setTimeout(() => card.classList.remove('alarm-state'), 4000);
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt)
      });
      const newInc = await res.json();
      this.incidents.unshift(newInc);
      this.renderIncidents();
      this.renderQuickAlarms();

      const badge = document.getElementById('incidents-badge');
      if (badge) badge.textContent = this.incidents.length;

      this.showToast(`ALERTA: ${evt.description}`, 'alarm');
    } catch (e) {
      console.error('Error al registrar incidencia:', e);
    }
  }

  // Incidents Data Handling
  async fetchIncidents() {
    try {
      const res = await fetch('/api/events');
      this.incidents = await res.json();
      this.renderIncidents();
      this.renderQuickAlarms();

      const badge = document.getElementById('incidents-badge');
      if (badge) badge.textContent = this.incidents.length;
    } catch (e) {
      console.error('Error cargando incidencias:', e);
    }
  }

  renderIncidents() {
    const tbody = document.getElementById('incidents-table-body');
    if (!tbody) return;

    // SVG Icons
    const iconAlert = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f87171" stroke-width="2" style="vertical-align:text-bottom; margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    const iconCheck = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#10b981" stroke-width="2.5" style="vertical-align:text-bottom; margin-right:3px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const iconInfo = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#60a5fa" stroke-width="2" style="vertical-align:text-bottom; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

    tbody.innerHTML = this.incidents.map(inc => {
      // Clean description without emoji
      const cleanDesc = inc.description.replace(/⚠️|🚨|🔒|📷/g, '').trim();
      const descIcon = inc.severity === 'HIGH' ? iconAlert : (inc.severity === 'MEDIUM' ? iconAlert : iconInfo);

      return `
        <tr>
          <td><code>${inc.id}</code></td>
          <td style="font-family:var(--font-mono);">${new Date(inc.timestamp).toLocaleTimeString()}</td>
          <td>
            <strong>${inc.cameraId}</strong>
            <br>
            <small style="color:var(--text-muted); font-size:0.65rem;">${inc.cameraName}</small>
          </td>
          <td>
            ${descIcon}
            <span>${cleanDesc}</span>
          </td>
          <td style="font-family:var(--font-mono); color:var(--accent-cyan); font-weight:600;">${inc.confidence}</td>
          <td>
            <span class="badge-sev ${inc.severity}">
              <span class="pulse-dot"></span>
              ${inc.severity}
            </span>
          </td>
          <td>
            ${inc.acknowledged 
              ? `<span class="status-solved-badge">${iconCheck}<span>Atendida • Cerrada</span></span>` 
              : `<span class="status-pending-badge"><span class="pulse-dot"></span><span>PENDIENTE</span></span>`}
          </td>
          <td>
            ${!inc.acknowledged 
              ? `<button class="btn-ack" onclick="window.app.ackIncident('${inc.id}')">
                  ${iconCheck}<span>Atender</span>
                </button>` 
              : `<span style="color:var(--text-muted); font-size:0.7rem;">Archivada</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  renderQuickAlarms() {
    const list = document.getElementById('quick-alarms-list');
    if (!list) return;

    list.innerHTML = this.incidents.slice(0, 5).map(inc => {
      const cleanDesc = inc.description.replace(/⚠️|🚨|🔒|📷/g, '').trim();
      return `
        <div class="alarm-item-mini severity-${inc.severity}">
          <div class="alarm-item-header">
            <span class="alarm-cam-name">${inc.cameraId}</span>
            <span class="alarm-time-tag">${new Date(inc.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="alarm-desc">${cleanDesc}</div>
        </div>
      `;
    }).join('');
  }

  async ackIncident(id) {
    try {
      await fetch(`/api/events/${id}/ack`, { method: 'POST' });
      const inc = this.incidents.find(i => i.id === id);
      if (inc) inc.acknowledged = true;
      this.renderIncidents();
      this.showToast(`Incidencia ${id} atendida y archivada en bitácora`, 'info');
    } catch (e) {
      console.error('Error atendiendo incidencia:', e);
    }
  }

  // Evidence Handling
  async fetchEvidence() {
    try {
      const res = await fetch('/api/evidence');
      this.evidenceList = await res.json();
      this.renderEvidence();
    } catch (e) {
      console.error('Error cargando evidencia:', e);
    }
  }

  renderEvidence() {
    const gallery = document.getElementById('evidence-gallery');
    const counter = document.getElementById('evidence-count');
    if (!gallery) return;

    if (counter) counter.textContent = `${this.evidenceList.length} Capturas`;

    if (this.evidenceList.length === 0) {
      gallery.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#60a5fa" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <strong>Bóveda Criptográfica Vacía</strong>
          <small>Presiona el botón de captura forense en cualquier cámara para guardar evidencia con hash SHA-256 inmutable.</small>
        </div>
      `;
      return;
    }

    gallery.innerHTML = this.evidenceList.map(item => `
      <div class="evidence-thumb-card">
        <img src="${item.dataUrl}" alt="Evidencia ${item.id}" class="evidence-img">
        <div class="evidence-meta">
          <strong>${item.id} (${item.cameraId})</strong>
          <small>${new Date(item.timestamp).toLocaleTimeString()} | SHA-256</small>
          <a href="${item.dataUrl}" download="${item.id}.jpg" style="color:var(--accent-blue); text-decoration:none; font-size:0.7rem; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Descargar JPG</span>
          </a>
        </div>
      </div>
    `).join('');
  }

  // ========================================================
  // PROFESSIONAL IAM ROLE SELECTOR
  // ========================================================
  initRoleSelector() {
    const wrap = document.getElementById('iam-profile-menu-wrap');
    const trigger = document.getElementById('iam-profile-trigger');
    const currentTitle = document.getElementById('current-role-title');
    const currentSubtitle = document.getElementById('current-role-subtitle');
    const userInitials = document.getElementById('header-user-initials');

    if (!wrap || !trigger) return;

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('open');
      }
    });

    // Role options
    const roleOptions = document.querySelectorAll('.iam-role-option');
    roleOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const role = opt.getAttribute('data-role');
        this.currentRole = role;

        roleOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');

        // Update UI labels based on role
        if (role === 'OPERATOR') {
          if (currentTitle) currentTitle.textContent = 'Operador CCTV (SOC)';
          if (currentSubtitle) currentSubtitle.textContent = 'IAM: Monitoring-ReadOnly';
          if (userInitials) userInitials.textContent = 'SO';
          this.showToast('Perfil IAM cambiado a: Operador CCTV (SOC)', 'info');
        } else if (role === 'ADMIN') {
          if (currentTitle) currentTitle.textContent = 'Admin Cloud (DevSecOps)';
          if (currentSubtitle) currentSubtitle.textContent = 'IAM: Full-Administrator';
          if (userInitials) userInitials.textContent = 'AC';
          this.showToast('Perfil IAM cambiado a: Admin Cloud (IAM Full Access)', 'success');
        } else if (role === 'AUDITOR') {
          if (currentTitle) currentTitle.textContent = 'Auditor Forense & Legal';
          if (currentSubtitle) currentSubtitle.textContent = 'IAM: Security-Compliance';
          if (userInitials) userInitials.textContent = 'AF';
          this.showToast('Perfil IAM cambiado a: Auditor Forense & Cumplimiento', 'info');
        }

        wrap.classList.remove('open');
      });
    });
  }

  // ========================================================
  // OFFICIAL FORENSIC INCIDENT AUDIT REPORT MODAL (PDF / PRINT)
  // ========================================================
  initReportModal() {
    const btnOpen = document.getElementById('btn-export-report');
    const modal = document.getElementById('report-modal');
    const btnClose = document.getElementById('btn-close-report-modal');
    const btnPrint = document.getElementById('btn-print-modal-report');
    const btnDownloadHtml = document.getElementById('btn-download-report-html');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        this.generateAndOpenReportModal();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        document.body.classList.add('printing-report');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-report');
        }, 1000);
      });
    }

    if (btnDownloadHtml) {
      btnDownloadHtml.addEventListener('click', () => {
        this.downloadReportAsHtml();
      });
    }
  }

  generateAndOpenReportModal() {
    const modal = document.getElementById('report-modal');
    const container = document.getElementById('printable-report-content');
    if (!modal || !container) return;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-ES') + ' UTC-5';
    const reportCode = 'VIG-AUD-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);

    // Compute metrics
    const totalIncidents = this.incidents.length;
    const highCount = this.incidents.filter(i => i.severity === 'HIGH').length;
    const medCount = this.incidents.filter(i => i.severity === 'MEDIUM').length;
    const lowCount = this.incidents.filter(i => i.severity === 'LOW').length;
    const attendedCount = this.incidents.filter(i => i.acknowledged).length;

    // Role display name
    let issuerRole = 'Operador de Turno SOC ( Alejandro Soto )';
    if (this.currentRole === 'ADMIN') issuerRole = 'Administrador de Infraestructura Cloud & DevSecOps';
    if (this.currentRole === 'AUDITOR') issuerRole = 'Auditor Forense de Seguridad y Cumplimiento';

    // Build incidents rows
    const incidentsRowsHtml = this.incidents.map((inc, idx) => `
      <tr>
        <td style="font-family:monospace; font-weight:bold;">${inc.id}</td>
        <td style="font-family:monospace;">${new Date(inc.timestamp).toLocaleTimeString()}</td>
        <td><strong>${inc.cameraId}</strong> - ${inc.cameraName}</td>
        <td>${inc.description.replace(/⚠️|🚨|🔒|📷/g, '').trim()}</td>
        <td style="font-family:monospace; font-weight:bold;">${inc.confidence}</td>
        <td style="font-weight:bold; color:${inc.severity === 'HIGH' ? '#dc2626' : (inc.severity === 'MEDIUM' ? '#d97706' : '#2563eb')}">${inc.severity}</td>
        <td>${inc.acknowledged ? 'Atendida / Cerrada' : 'Pendiente de Inspección'}</td>
      </tr>
    `).join('');

    // Build evidence items
    let evidenceHtml = '';
    if (this.evidenceList.length > 0) {
      evidenceHtml = `
        <h4 class="report-section-title">Evidencias Fotográficas Digitales Vinculadas</h4>
        <div class="report-evidence-grid">
          ${this.evidenceList.map(ev => `
            <div class="report-evidence-item">
              <img src="${ev.dataUrl}" alt="Evidencia ${ev.id}">
              <div class="report-evidence-meta">
                <strong>ID: ${ev.id} | Cámara: ${ev.cameraId}</strong>
                <small>Fecha: ${new Date(ev.timestamp).toLocaleString()} | Región: us-east-1</small>
                <small style="color:#2563eb;">Hash SHA-256: ${ev.hashSHA256.substring(0, 32)}...</small>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="report-paper-header">
        <div class="report-paper-brand">
          <span class="report-classification-badge">CONFIDENCIAL / USO OFICIAL E INTERNO</span>
          <h2>INFORME OFICIAL DE AUDITORÍA FORENSE & INCIDENCIAS</h2>
          <span>VIGILA CLOUD SURVEILLANCE & SECURITY OPERATIONS CENTER (SOC)</span>
        </div>
        <div class="report-paper-meta">
          <div><strong>Código de Informe:</strong> ${reportCode}</div>
          <div><strong>Fecha de Emisión:</strong> ${dateFormatted}</div>
          <div><strong>Hora de Registro:</strong> ${timeFormatted}</div>
          <div><strong>Infraestructura AWS:</strong> VPC-VIGILA-PROD (us-east-1)</div>
        </div>
      </div>

      <div class="report-stats-grid">
        <div class="report-stat-card">
          <strong>${totalIncidents}</strong>
          <span>Total Alertas</span>
        </div>
        <div class="report-stat-card">
          <strong style="color:#dc2626;">${highCount}</strong>
          <span>Severidad Alta</span>
        </div>
        <div class="report-stat-card">
          <strong style="color:#d97706;">${medCount}</strong>
          <span>Severidad Media</span>
        </div>
        <div class="report-stat-card">
          <strong style="color:#16a34a;">${attendedCount} / ${totalIncidents}</strong>
          <span>Atendidas</span>
        </div>
      </div>

      <h4 class="report-section-title">Registro Detallado de Incidentes Detectados</h4>
      <table class="report-table-formal">
        <thead>
          <tr>
            <th>Código ID</th>
            <th>Hora</th>
            <th>Cámara / Ubicación</th>
            <th>Descripción del Evento</th>
            <th>Confianza IA</th>
            <th>Severidad</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${incidentsRowsHtml || '<tr><td colspan="7" style="text-align:center;">No se registraron incidentes en el período.</td></tr>'}
        </tbody>
      </table>

      ${evidenceHtml}

      <div class="report-legal-notice">
        <strong>Certificación de Integridad & Cadena de Custodia Legal:</strong><br>
        Este informe técnico certifica que las transmisiones de video, capturas forenses y bitácoras asociadas se encuentran debidamente cifradas bajo el estándar AES-256 (AWS KMS) con preservación inmutable en almacenamiento Amazon S3 Glacier Flexible Archive, dando cumplimiento estricto a las directrices de la norma internacional <strong>ISO/IEC 27037</strong> sobre recolección, identificación y preservación de evidencia digital.
      </div>

      <div class="report-signature-row">
        <div class="signature-block">
          <strong>${issuerRole}</strong>
          <span>Responsable de Turno / Emisor</span>
        </div>
        <div class="signature-block">
          <strong>Dirección de Seguridad de la Información</strong>
          <span>Auditoría & Cumplimiento CISO</span>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  downloadReportAsHtml() {
    const content = document.getElementById('printable-report-content');
    if (!content) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe Oficial VIGILA - ${new Date().toISOString().substring(0, 10)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; background: #fff; color: #111; max-width: 900px; margin: 0 auto; }
          .report-classification-badge { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
          .report-paper-header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px; }
          .report-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .report-stat-card { border: 1px solid #ddd; padding: 12px; text-align: center; border-radius: 6px; }
          .report-stat-card strong { display: block; font-size: 22px; }
          .report-section-title { border-bottom: 1.5px solid #ddd; padding-bottom: 5px; margin: 25px 0 10px 0; text-transform: uppercase; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f4f4f4; }
          .report-evidence-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .report-evidence-item { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
          .report-evidence-item img { width: 100%; height: 160px; object-fit: cover; }
          .report-evidence-meta { padding: 8px; font-size: 11px; }
          .report-legal-notice { background: #f9f9f9; border-left: 3px solid #2563eb; padding: 12px; font-size: 11px; margin: 20px 0; }
          .report-signature-row { display: flex; justify-content: space-between; margin-top: 50px; }
          .signature-block { width: 220px; border-top: 1px solid #111; text-align: center; padding-top: 5px; font-size: 12px; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Informe_Forense_VIGILA_${new Date().toISOString().substring(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Informe oficial descargado como archivo HTML independiente', 'success');
  }

  // Fullscreen support
  initFullscreen() {
    const btn = document.getElementById('btn-fullscreen');
    if (btn) {
      btn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.warn(err));
        } else {
          document.exitFullscreen().catch(err => console.warn(err));
        }
      });
    }
  }

  // Toast Notifications
  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${msg}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  window.app = new VigilaApp();
  window.app.init();
  window.app.initReportModal();
});
