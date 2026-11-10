const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Data Store (Simulates Database Aurora PostgreSQL)
let cameras = [
  {
    id: 'CAM-01',
    name: 'Cámara Operador / Webcam Local',
    location: 'Estación de Monitoreo Central (SOC)',
    type: 'WEBCAM_OR_AI',
    status: 'ONLINE',
    resolution: '1920x1080 (FHD)',
    fps: 30,
    bitrate: '2,450 Kbps',
    codec: 'H.265 / HEVC (Opt. 50% Ancho Banda)',
    storageTier: 'S3 Standard (Hot - 7 Días)',
    encryption: 'AES-256 (KMS)',
    ptzSupported: true,
    irNightVision: false,
    motionDetected: false,
    lastEvent: 'Sistema inicializado'
  },
  {
    id: 'CAM-02',
    name: 'Centro de Cómputo / Servidores',
    location: 'Sala Blanca - Rack A1-A8',
    type: 'SIMULATED_DATACENTER',
    status: 'ONLINE',
    resolution: '1920x1080 (FHD)',
    fps: 30,
    bitrate: '1,820 Kbps',
    codec: 'H.265 / HEVC',
    storageTier: 'S3 Standard (Hot - 7 Días)',
    encryption: 'AES-256 (KMS)',
    ptzSupported: true,
    irNightVision: false,
    motionDetected: false,
    lastEvent: 'Temperatura normal 19.4°C'
  },
  {
    id: 'CAM-03',
    name: 'Acceso Principal y Recepción',
    location: 'Lobby Edificio Corporativo',
    type: 'SIMULATED_LOBBY',
    status: 'ONLINE',
    resolution: '3840x2160 (4K UHD)',
    fps: 25,
    bitrate: '4,100 Kbps',
    codec: 'H.265 / HEVC',
    storageTier: 'S3 Standard (Hot - 7 Días)',
    encryption: 'AES-256 (KMS)',
    ptzSupported: true,
    irNightVision: false,
    motionDetected: false,
    lastEvent: 'Torniquetes en operación'
  },
  {
    id: 'CAM-04',
    name: 'Perímetro Sur y Estacionamiento',
    location: 'Área Exterior - Garita 2',
    type: 'SIMULATED_PERIMETER',
    status: 'ONLINE',
    resolution: '1920x1080 (FHD)',
    fps: 25,
    bitrate: '2,100 Kbps',
    codec: 'H.265 / HEVC',
    storageTier: 'S3 Standard-IA (Warm - 30 Días)',
    encryption: 'AES-256 (KMS)',
    ptzSupported: true,
    irNightVision: true,
    motionDetected: false,
    lastEvent: 'Patrullaje perimetral activo'
  },
  {
    id: 'CAM-05',
    name: 'Bóveda de Valores y Archivo',
    location: 'Sótano 2 - Zona Restringida',
    type: 'SIMULATED_VAULT',
    status: 'ONLINE',
    resolution: '1920x1080 (FHD)',
    fps: 30,
    bitrate: '1,950 Kbps',
    codec: 'H.265 / HEVC',
    storageTier: 'S3 Glacier Flexible (Cold - 180 Días)',
    encryption: 'AES-256 (KMS CloudHSM)',
    ptzSupported: true,
    irNightVision: true,
    motionDetected: false,
    lastEvent: 'Cerradura biométrica asegurada'
  },
  {
    id: 'CAM-06',
    name: 'Muelle de Carga y Logística',
    location: 'Bahías 1 a 4 - Despachos',
    type: 'SIMULATED_LOADING_DOCK',
    status: 'ONLINE',
    resolution: '1920x1080 (FHD)',
    fps: 25,
    bitrate: '2,600 Kbps',
    codec: 'H.265 / HEVC',
    storageTier: 'S3 Standard-IA (Warm - 30 Días)',
    encryption: 'AES-256 (KMS)',
    ptzSupported: true,
    irNightVision: false,
    motionDetected: false,
    lastEvent: 'Montacargas en tránsito'
  }
];

let incidents = [
  {
    id: 'INC-1092',
    timestamp: new Date(Date.now() - 420000).toISOString(),
    cameraId: 'CAM-04',
    cameraName: 'Perímetro Sur y Estacionamiento',
    type: 'MOTION_DETECTED',
    severity: 'MEDIUM',
    confidence: '94.2%',
    description: 'Movimiento vehicular detectado en horario restringido',
    snapshotUrl: null,
    acknowledged: true,
    operator: 'Operador-01'
  },
  {
    id: 'INC-1093',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    cameraId: 'CAM-02',
    cameraName: 'Centro de Cómputo / Servidores',
    type: 'ACCESS_GRANTED',
    severity: 'LOW',
    confidence: '99.0%',
    description: 'Acceso autorizado con tarjeta RFID - Técnico de Infraestructura',
    snapshotUrl: null,
    acknowledged: true,
    operator: 'Automático'
  }
];

let snapshotsEvidence = [];

let ssmAutomationLogs = [
  {
    executionId: 'cmd-049a37e90c1f',
    documentName: 'AWS-ApplySecurityHardeningAndCIS',
    target: 'All-Surveillance-Nodes (EC2 / Edge)',
    status: 'Success',
    executedAt: new Date(Date.now() - 3600000).toLocaleTimeString(),
    details: 'Actualización de certificados TLS 1.3, rotación de claves IAM y verificación de auditoría.'
  },
  {
    executionId: 'cmd-082bc81e3a4d',
    documentName: 'AWS-S3-StorageLifecycleTransition',
    target: 'vigila-video-archive-bucket',
    status: 'Success',
    executedAt: new Date(Date.now() - 7200000).toLocaleTimeString(),
    details: 'Migración automática de 142 GB a Glacier Flexible Archive. Reducción estimada de costo: 68%.'
  }
];

// API: Get System Status
app.get('/api/status', (req, res) => {
  const onlineCams = cameras.filter(c => c.status === 'ONLINE').length;
  res.json({
    status: 'HEALTHY',
    systemName: 'VIGILA Cloud Video Surveillance Platform',
    version: '2.5.0-Enterprise',
    cloudRegion: 'us-east-1 (Simulated High-Availability VPC)',
    camerasTotal: cameras.length,
    camerasOnline: onlineCams,
    storageHotGB: 480.5,
    storageWarmGB: 1840.2,
    storageColdGlacierGB: 8520.0,
    monthlyCostNonOptimized: 10748.00,
    monthlyCostOptimized: 3150.00,
    costSavingsPercent: 70.7,
    cpuAvgLoad: '28.4%',
    uptime: '99.98%'
  });
});

// API: Get Cameras
app.get('/api/cameras', (req, res) => {
  res.json(cameras);
});

// API: Update Camera status or attributes
app.patch('/api/cameras/:id', (req, res) => {
  const cam = cameras.find(c => c.id === req.params.id);
  if (!cam) return res.status(404).json({ error: 'Cámara no encontrada' });
  
  if (req.body.status) cam.status = req.body.status;
  if (req.body.irNightVision !== undefined) cam.irNightVision = req.body.irNightVision;
  if (req.body.motionDetected !== undefined) cam.motionDetected = req.body.motionDetected;
  if (req.body.lastEvent) cam.lastEvent = req.body.lastEvent;

  res.json(cam);
});

// API: Get Incident Events
app.get('/api/events', (req, res) => {
  res.json(incidents);
});

// API: Report Incident
app.post('/api/events', (req, res) => {
  const { cameraId, type, severity, description, confidence, snapshotUrl } = req.body;
  const cam = cameras.find(c => c.id === cameraId) || { name: 'Cámara Desconocida' };
  
  const newIncident = {
    id: 'INC-' + (1000 + incidents.length + 1),
    timestamp: new Date().toISOString(),
    cameraId: cameraId || 'CAM-01',
    cameraName: cam.name,
    type: type || 'MOTION_DETECTED',
    severity: severity || 'MEDIUM',
    confidence: confidence || '91.5%',
    description: description || 'Detección de evento en zona configurada',
    snapshotUrl: snapshotUrl || null,
    acknowledged: false,
    operator: 'Operador SOC'
  };

  incidents.unshift(newIncident);
  if (incidents.length > 50) incidents.pop(); // keep last 50

  res.status(201).json(newIncident);
});

// API: Acknowledge Incident
app.post('/api/events/:id/ack', (req, res) => {
  const inc = incidents.find(i => i.id === req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incidencia no encontrada' });
  inc.acknowledged = true;
  res.json(inc);
});

// API: Save Evidence Snapshot
app.post('/api/evidence/snapshot', (req, res) => {
  const { cameraId, dataUrl, notes, label } = req.body;
  const item = {
    id: 'EVD-' + Date.now().toString(36).toUpperCase(),
    timestamp: new Date().toISOString(),
    cameraId: cameraId || 'CAM-01',
    label: label || 'Captura de Evidencia Manual',
    notes: notes || 'Captura registrada durante ronda de vigilancia',
    dataUrl: dataUrl || null,
    hashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  };
  snapshotsEvidence.unshift(item);
  res.status(201).json(item);
});

// API: Get Evidence List
app.get('/api/evidence', (req, res) => {
  res.json(snapshotsEvidence);
});

// API: SSM Automation Simulator
app.get('/api/ssm/tasks', (req, res) => {
  res.json(ssmAutomationLogs);
});

app.post('/api/ssm/execute', (req, res) => {
  const { documentName, target, description } = req.body;
  const newLog = {
    executionId: 'cmd-' + Math.random().toString(16).substr(2, 12),
    documentName: documentName || 'AWS-CustomPatchAndCompliance',
    target: target || 'All-Nodes',
    status: 'Success',
    executedAt: new Date().toLocaleTimeString(),
    details: description || 'Ejecución automatizada de tarea de mantenimiento exitosa.'
  };
  ssmAutomationLogs.unshift(newLog);
  res.json(newLog);
});

// API: Cost Architecture Comparison
app.get('/api/cost-analysis', (req, res) => {
  res.json({
    camerasCount: cameras.length,
    unoptimized: {
      ec2_compute: 2448.00,
      ebs_storage_hot: 5200.00,
      network_egress: 3100.00,
      total_monthly: 10748.00,
      details: [
        '20 instancias EC2 c5.2xlarge ejecutándose 24/7 sin auto-escalado.',
        'Almacenamiento exclusivo en discos EBS gp3 costosos para todo el historial.',
        'Tráfico de streaming no comprimido (H.264 básico sin optimización de tasa de bits).'
      ]
    },
    optimized: {
      ec2_spot_and_lambda: 734.00,
      s3_lifecycle_storage: 1616.00,
      network_and_aurora: 800.00,
      total_monthly: 3150.00,
      savings_monthly: 7598.00,
      savings_percentage: 70.7,
      details: [
        'Transcodificación por eventos con AWS Lambda + instancias EC2 Spot para procesamiento batch (Ahorro del 70% en cómputo).',
        'Ciclo de vida S3 Intelligent-Tiering: 7 días en Hot S3, 30 días en S3 Infrequent Access, y archivo a S3 Glacier Flexible.',
        'Compresión de video adaptativa H.265/HEVC que reduce el consumo de ancho de banda a la mitad.',
        'Base de datos relacional Aurora Serverless con escalado dinámico de lectura/escritura.'
      ]
    }
  });
});

// API: List available local videos
app.get('/api/videos', (req, res) => {
  const dir = path.join(__dirname, 'public', 'videos');
  if (!fs.existsSync(dir)) return res.json([]);
  try {
    const files = fs.readdirSync(dir)
      .filter(f => /\.(mp4|webm|mkv|mov|avi)$/i.test(f))
      .map(f => {
        const stats = fs.statSync(path.join(dir, f));
        return {
          name: f,
          url: `/videos/${f}`,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
        };
      });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Upload video file from local client
app.post('/api/upload-video', (req, res) => {
  const { fileName, base64Data, cameraId } = req.body;
  if (!base64Data) return res.status(400).json({ error: 'No se recibieron datos de video' });
  
  const cleanName = (fileName || 'video-' + Date.now() + '.mp4').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const dir = path.join(__dirname, 'public', 'videos');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const filePath = path.join(dir, cleanName);
  try {
    const base64Pure = base64Data.replace(/^data:video\/[a-zA-Z0-9.-]+;base64,/, '');
    const buffer = Buffer.from(base64Pure, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    // If cameraId provided, update camera status in-memory
    if (cameraId) {
      const cam = cameras.find(c => c.id === cameraId);
      if (cam) {
        cam.videoSrc = `/videos/${cleanName}`;
        cam.lastEvent = `Video local cargado: ${cleanName}`;
      }
    }
    
    res.json({
      success: true,
      fileName: cleanName,
      url: `/videos/${cleanName}`,
      sizeMB: (buffer.length / (1024 * 1024)).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar video en disco: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log('================================================================');
  console.log(` VIGILA Cloud Video Surveillance Platform iniciada`);
  console.log(` Dashboard accesible en: http://localhost:${PORT}`);
  console.log('================================================================');
});

