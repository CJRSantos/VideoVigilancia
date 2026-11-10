# VIGILA Cloud — Enterprise Security Operations Center (SOC) & Video Surveillance Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v4.19-000000?logo=express&logoColor=white)](https://expressjs.com)
[![AWS Architecture](https://img.shields.io/badge/AWS-Architecture_Optimized-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![Codec](https://img.shields.io/badge/Video-H.265%20%2F%20HEVC-00f0ff)](https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding)
[![Security](https://img.shields.io/badge/Security-KMS%20%7C%20TLS%201.3%20%7C%20IAM-10b981)](#-estrategia-de-seguridad-integral)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Plataforma empresarial de simulación y monitoreo de videovigilancia en la nube (**CCTV / SOC**), diseñada como solución integral y demostrador técnico al **Caso Práctico de Migración y Optimización de Costos en AWS de la empresa VIGILA**.

El sistema integra una estación de control en tiempo real con video CCTV genuino, analítica de movimiento por visión computacional, bóveda forense con sellado criptográfico SHA-256, generador de informes en PDF e implementación interactiva de los 5 pilares del **AWS Well-Architected Framework**.

---

## 📌 Tabla de Contenidos

- [Resumen Ejecutivo & Problemática Resuelta](#-resumen-ejecutivo--problemática-resuelta)
- [Comparativa de Costos AWS: Antes vs. Propuesta VIGILA](#-comparativa-de-costos-aws-antes-vs-propuesta-vigila)
- [Características Principales](#-características-principales)
- [Arquitectura Técnica en AWS](#-arquitectura-técnica-en-aws)
- [Estrategia de Almacenamiento Jerárquico (S3 + Glacier)](#-estrategia-de-almacenamiento-jerárquico-s3--glacier)
- [Seguridad & Control de Acceso (IAM / RBAC)](#-seguridad--control-de-acceso-iam--rbac)
- [Automatización con AWS Systems Manager (SSM)](#-automatización-con-aws-systems-manager-ssm)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Guía de Instalación y Ejecución Local](#-guía-de-instalación-y-ejecución-local)
- [Rúbrica Académica del Caso Práctico](#-rúbrica-académica-del-caso-práctico)
- [Licencia](#-licencia)

---

## 🏢 Resumen Ejecutivo & Problemática Resuelta

Durante el proceso inicial de migración de **VIGILA** a AWS, la empresa experimentó:
1. **Incremento inesperado de costos** por mantener instancias de cómputo `c5.2xlarge` encendidas 24/7 sin autoescalado.
2. **Cuellos de botella de almacenamiento** debido a la retención de grabaciones en discos EBS gp3 costosos y estáticos.
3. **Saturación en bases de datos Amazon RDS** por concurrencia desmedida de escrituras y lecturas de telemetría.
4. **Vulnerabilidades de seguridad** (permisos sobreasignados en IAM, falta de cifrado KMS y puertos SSH expuestos).
5. **Mantenimiento manual ineficiente** sin automatización centralizada.

### 💡 Solución Implementada
La plataforma optimizada reduce la factura mensual de AWS en un **70.7%** (ahorro anual proyectado de **$91,176.00 USD**), eleva la disponibilidad al **99.98% (SLA)** y garantiza latencias de streaming en tiempo real inferiores a **65 ms**.

---

## 💰 Comparativa de Costos AWS: Antes vs. Propuesta VIGILA

| Componente | Antes (Arquitectura No Optimizada) | Propuesta VIGILA (Arquitectura Optimizada) | Estrategia Aplicada |
| :--- | :--- | :--- | :--- |
| **Cómputo (Transcodificación)** | **$2,448.00 / mes**<br><small>20x EC2 c5.2xlarge 24/7 On-Demand</small> | **$734.00 / mes**<br><small>AWS Lambda + EC2 Spot Auto-scaling</small> | **Spot + Serverless** (Ahorro 70%) |
| **Almacenamiento de Video** | **$5,200.00 / mes**<br><small>Discos EBS gp3 estáticos para todo el video</small> | **$1,616.00 / mes**<br><small>S3 Intelligent-Tiering + Glacier Deep Archive</small> | **S3 Lifecycle Policies** (Ahorro 69%) |
| **Transferencia de Red (Egress)** | **$3,100.00 / mes**<br><small>Streaming H.264 directo sin caché CDN</small> | **$800.00 / mes**<br><small>Códec H.265/HEVC + Amazon CloudFront</small> | **H.265 + CloudFront** (Ahorro 74%) |
| **TOTAL MENSUAL** | **$10,748.00 USD** | **$3,150.00 USD** | <strong style="color:#10b981;">Ahorro: $7,598.00 USD / mes (70.7%)</strong> |

---

## 🚀 Características Principales

### 1. 🖥️ Muro de Video CCTV Multicanal (SOC en Vivo)
- **6 Canales Simultáneos:** Transmisiones fluidas de video CCTV real (Acceso Principal, Datacenter, Recepción comercial, Perímetro sur, Garita exterior y Muelle logístico).
- **Malla Dinámica:** Cambio instantáneo de cuadrículas: `1x1` (cámara única en detalle), `2x2` (4 cámaras) o `6 CAMS` (matriz total 3x2).
- **Filtro Infrarrojo Digital (IR):** Simulación de visión nocturna de alto contraste por canal.

### 2. 📂 Ingesta de Video Local & Cámara Web
- **Carga de Archivos Locales:** Soporte drag-and-drop o selector de archivos de video (`MP4`, `WebM`, `MKV`, `MOV`) desde el disco duro del usuario hacia cualquier cámara.
- **Conexión de Webcam Física:** Integración directa mediante la API `navigator.mediaDevices.getUserMedia` para proyectar la cámara web local en la cámara 01.

### 3. 🎯 Motor de Visión Computacional & Alertas en Tiempo Real
- Análisis de fotogramas mediante `<canvas>` en tiempo real con detección de movimiento por umbrales de diferencia píxel a píxel.
- Renderizado de cajas delimitadoras (*bounding boxes*), porcentajes de confianza por IA (98.7%) y marcas de agua temporales inmutables con precisión de milisegundos.
- Sintetizador de alarma auditiva (*Web Audio API*) y disparador de simulación de intrusiones de alta prioridad.

### 4. 🕹️ Controlador PTZ Digital (Pan-Tilt-Zoom)
- Consola de control direccional (arriba, abajo, izquierda, derecha y centrado) con iconos vectoriales SVG.
- Ajuste de zoom óptico y digital con escala progresiva de `1.0x` a `5.0x`.

### 5. 🔒 Bóveda de Evidencias Forenses & Criptografía
- Captura de instantáneas forenses de alta resolución con estampado inmutable: ID de Cámara, Timestamp UTC-5, Rol del operador y **Firma Hash SHA-256**.
- Simulación de almacenamiento seguro con retención legal en **Amazon S3 Glacier**.

### 6. 🖨️ Generación de Informes Oficiales en PDF
- Exportación automatizada de reportes de auditoría forense con bitácora de incidencias, sellos de tiempo y capturas adjuntas.
- Diseñado con reglas de impresión `@media print` en formato A4/Carta formal sin elementos decorativos de interfaz.

---

## 🏛️ Arquitectura Técnica en AWS

```text
       [ CÁMARAS IP / ENLACES CCTV LOCALES ]
                         │
                         ▼ (TLS 1.3 / H.265)
              [ AWS WAF & Amazon Route 53 ]
                         │
                         ▼
             [ Amazon CloudFront CDN ]
                         │
     ┌───────────────────┴───────────────────┐
     ▼                                       ▼
[ Amazon S3 ]                          [ Amazon API Gateway ]
(Streaming Hot & Web GUI)                    │
                                             ▼
                                     [ AWS Lambda (Serverless) ]
                                     (Eventos de Movimiento / Alertas)
                                             │
                         ┌───────────────────┴───────────────────┐
                         ▼                                       ▼
            [ Amazon Aurora PostgreSQL ]             [ Auto Scaling Group ]
            • Multi-AZ Failover                     • EC2 Spot Instances (c5.2xlarge)
            • Read Replicas (SOC)                   • Transcodificación de video
            • RDS Proxy (Connection Pool)           • Amazon Systems Manager (SSM)
```

---

## 🗄️ Estrategia de Almacenamiento Jerárquico (S3 + Glacier)

```
┌────────────────────────────────────────────────────────┐
│  Día 1 - 7: Amazon S3 Standard ($0.023/GB)            │
│  Streaming en vivo instantáneo y analítica SOC         │
└──────────────────────────┬─────────────────────────────┘
                           │ (Regla de Ciclo de Vida: 7 Días)
                           ▼
┌────────────────────────────────────────────────────────┐
│  Día 8 - 30: Amazon S3 Standard-IA ($0.0125/GB)        │
│  Acceso infrecuente para investigaciones recientes     │
└──────────────────────────┬─────────────────────────────┘
                           │ (Regla de Ciclo de Vida: 30 Días)
                           ▼
┌────────────────────────────────────────────────────────┐
│  Día 31 - 365+: Amazon S3 Glacier Deep Archive        │
│  Custodia legal y retención obligatoria ($0.0036/GB)  │
└────────────────────────────────────────────────────────┘
```

---

## 🛡️ Seguridad & Control de Acceso (IAM / RBAC)

La plataforma aplica el **Principio de Menor Privilegio (Least Privilege)** mediante selector de perfiles en vivo:

| Rol IAM | Permisos Asignados | Restricciones |
| :--- | :--- | :--- |
| **Admin Cloud (IAM Full)** | Control total de infraestructura, SSM, auditoría de costos y políticas de almacenamiento. | Requiere autenticación MFA estricta. |
| **Operador CCTV (SOC)** | Monitoreo en vivo de cámaras, joystick PTZ, activación de filtros IR y registro de alertas. | Bloqueado para modificación de arquitectura o costos. |
| **Auditor Forense** | Consulta de bitácora de eventos, descarga de capturas, verificación de hashes SHA-256 e impresión de reportes PDF. | Acceso de solo lectura (*Read-Only*). |

---

## ⚙️ Automatización con AWS Systems Manager (SSM)

- **SSM Session Manager:** Administración y consola interactiva remota **sin abrir el puerto 22 (SSH)**, eliminando la necesidad de IPs públicas o servidores Bastion.
- **SSM Patch Manager:** Parchado automatizado del sistema operativo y dependencias en ventanas de mantenimiento sin corte de servicio.
- **SSM State Manager:** Validación de estado de agentes de monitoreo y sincronización de configuraciones de video.

---

## 📁 Estructura del Proyecto

```text
vigila-cloud-surveillance/
├── server.js                     # Servidor Node.js/Express con APIs REST
├── package.json                  # Dependencias y configuración del proyecto
├── iniciar_vigila.bat            # Script de inicio rápido en 1 clic (Windows)
├── INSTRUCCIONES.md              # Manual de usuario y puesta en marcha
├── PROYECTO_VIGILA_SOLUCION.md   # Documento académico formal con respuestas al caso
├── .gitignore                    # Filtro de archivos para Git
├── public/                       # Front-end estático (SPA)
│   ├── index.html                # Consola SOC, layouts, modales y reporte PDF
│   ├── styles.css                # Estilos responsive, tema dark SOC y scrollbars
│   ├── app.js                   # Controlador principal, webcams y eventos
│   ├── js/
│   │   ├── camera-simulator.js   # Simulación de telemetría y streams
│   │   ├── motion-detector.js    # Motor de visión por computadora
│   │   ├── cost-calculator.js    # Simulador dinámico de costos AWS
│   │   └── ssm-simulator.js      # Consola y registros de AWS Systems Manager
│   └── videos/                   # Grabaciones reales CCTV para simulación
│       ├── cam1-entrance.mp4
│       ├── cam2-indoor.mp4
│       ├── cam3-lobby.mp4
│       ├── cam4-parking.mp4
│       ├── cam5-perimeter.mp4
│       └── cam6-logistics.mp4
```

---

## 🛠️ Guía de Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org) versión 18 o superior instalada.
- Navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox).

### Pasos de Ejecución
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CJRSantos/VideoVigilancia.git
   cd VideoVigilancia
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor:**
   ```bash
   node server.js
   ```
   *(En Windows también puedes hacer doble clic en `iniciar_vigila.bat`)*

4. **Abrir en el navegador:**
   Ingresa a: **`http://localhost:3000`**

---

## 🎓 Rúbrica Académica del Caso Práctico

Este proyecto cubre la totalidad de condiciones solicitadas para el caso práctico de arquitectura cloud:
- [x] Identificación y resolución de puntos críticos de rendimiento y sobrecostos.
- [x] Optimización de cómputo con EC2 Spot Instances y funciones serverless AWS Lambda.
- [x] Estructuración de base de datos relacional de alto rendimiento con Amazon Aurora Multi-AZ y RDS Proxy.
- [x] Estrategia de seguridad integral con IAM, Amazon VPC privada, grupos de seguridad y cifrado AWS KMS.
- [x] Automatización centralizada de mantenimiento mediante AWS Systems Manager.
- [x] Gestión de ciclo de vida de almacenamiento masivo con Amazon S3 y Glacier Deep Archive.
- [x] Cuantificación de ahorros económicos (70.7% demostrado) y métricas de disponibilidad (99.98% SLA).

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE). Desarrollado con fines educativos y de arquitectura cloud enterprise.
