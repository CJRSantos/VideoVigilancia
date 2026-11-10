/**
 * VIGILA Cloud Surveillance - AWS Systems Manager (SSM) Simulator
 * Automates maintenance, security compliance and lifecycle migrations.
 */

class SSMSimulator {
  constructor() {
    this.logsContainer = document.getElementById('ssm-logs-container');
    this.btnRunTask = document.getElementById('btn-run-ssm-task');
  }

  init() {
    this.loadTasks();

    if (this.btnRunTask) {
      this.btnRunTask.addEventListener('click', () => {
        this.executeMaintenanceTask();
      });
    }
  }

  async loadTasks() {
    if (!this.logsContainer) return;
    try {
      const res = await fetch('/api/ssm/tasks');
      const tasks = await res.json();
      this.renderLogs(tasks);
    } catch (e) {
      console.error('Error cargando registros SSM:', e);
    }
  }

  renderLogs(tasks) {
    if (!this.logsContainer) return;
    this.logsContainer.innerHTML = tasks.map(t => `
      <div class="ssm-log-item">
        <span class="ssm-log-status-success">[SUCCESS]</span>
        <strong>${t.documentName}</strong> (${t.executedAt})
        <br>
        <span style="color:#94a3b8;">Destino: ${t.target} | ID: ${t.executionId}</span>
        <br>
        <span style="color:#6ee7b7;">${t.details}</span>
      </div>
    `).join('');
  }

  async executeMaintenanceTask() {
    const tasksOptions = [
      {
        documentName: 'AWS-SSM-RotateKMSKeysAndAudit',
        target: 'Security-VPC-Production',
        description: 'Rotación automática de llaves maestras KMS de cifrado de video y verificación de permisos IAM.'
      },
      {
        documentName: 'AWS-SSM-CameraFirmwareHealthCheck',
        target: 'All-Cameras (CAM-01 a CAM-06)',
        description: 'Verificación de integridad de streaming RTSP/WebRTC y latencia de compresión H.265.'
      },
      {
        documentName: 'AWS-SSM-S3StorageTierArchival',
        target: 's3://vigila-recordings-archive',
        description: 'Transición automatizada de grabaciones mayores a 30 días hacia Glacier Flexible Archive.'
      }
    ];

    const chosen = tasksOptions[Math.floor(Math.random() * tasksOptions.length)];

    try {
      const res = await fetch('/api/ssm/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chosen)
      });
      const newLog = await res.json();
      this.loadTasks();

      if (window.app && window.app.showToast) {
        window.app.showToast(`SSM: ${newLog.documentName} ejecutado con éxito`, 'success');
      }
    } catch (e) {
      console.error('Error al ejecutar tarea SSM:', e);
    }
  }
}

window.SSMSimulator = SSMSimulator;

