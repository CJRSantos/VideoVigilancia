# PROPUESTA TÉCNICA Y ARQUITECTÓNICA INTEGRAL
## Solución al Caso Práctico: Optimización de Infraestructura Cloud para la Empresa VIGILA
**Empresa Evaluada:** VIGILA - Servicios de Videovigilancia en la Nube  
**Materia / Especialidad:** Arquitectura de Sistemas Cloud & Seguridad  
**Fecha:** Noviembre 2026  
**Entregable:** Informe Técnico Formal y Prototipo de Software Interactivo en Tiempo Real  

---

## 1. Resumen Ejecutivo
La empresa **VIGILA** experimentó graves desafíos económicos y operativos tras migrar su plataforma de videovigilancia a Amazon Web Services (AWS). Los principales síntomas detectados fueron:
- Incremento desmedido de costos de cómputo por instancias EC2 dedicadas 24/7.
- Uso ineficiente de almacenamiento en bloques (EBS) para archivar video masivo.
- Cuellos de botella en la base de datos relacional.
- Vulnerabilidades de seguridad perimetral y falta de automatización en tareas de mantenimiento.

El presente documento expone la **solución arquitectónica optimizada**, respaldada por un **software interactivo funcional de simulación profesional**, que reduce los costos mensuales en un **70.7%** (de \$10,748 USD a \$3,150 USD), garantizando una disponibilidad del **99.98% (SLA)** y cumplimiento estricto de los estándares CIS Benchmark e ISO 27001.

---

## 2. Diagnóstico de la Infraestructura Actual y Puntos Críticos

| Componente | Estado No Optimizado (Antes) | Problema Generado | Impacto en VIGILA |
| :--- | :--- | :--- | :--- |
| **Cómputo (EC2)** | 20 instancias `c5.2xlarge` fijas 24/7 para decodificación y transcodificación continua. | Las cámaras graban escenas estáticas >70% del tiempo. Se paga por CPU ociosa. | Gasto mensual de \$2,448 USD solo en cómputo base. |
| **Almacenamiento** | Volúmenes Amazon EBS gp3 conservando grabaciones históricas de meses. | Costo por GB de EBS (\$0.08/GB) es prohibitivo para video masivo que casi nunca se vuelve a consultar. | Costo mensual de \$5,200 USD en almacenamiento. |
| **Transferencia de Red** | Streaming continuo en códec H.264 sin compresión adaptativa ni CDN. | Consumo desmedido de ancho de banda de salida (*Data Egress*). | Sobrecosto de \$3,100 USD mensuales en red. |
| **Base de Datos** | Instancia RDS mononodo almacenando fragmentos de video y metadatos juntos. | Cuello de botella I/O en horas pico y riesgo de caída total ante fallas. | Latencia en alertas y tiempos de búsqueda forense >45 segundos. |
| **Seguridad e IAM** | Instancias con IPs públicas directas, claves compartidas y acceso SSH abierto. | Exposición a ataques DDoS y fuga de datos de clientes. | Riesgo crítico de brecha de seguridad y multas regulatorias. |
| **Mantenimiento** | Parches y diagnósticos manuales mediante SSH servidor por servidor. | Desfase en versiones de seguridad y alto consumo de horas-hombre. | Vulnerabilidades no mitigadas a tiempo. |

---

## 3. Propuesta de Optimización de Cómputo (EC2, Spot & Serverless)

### 3.1. Arquitectura Híbrida Guiada por Eventos
En lugar de mantener máquinas EC2 encendidas continuamente procesando transmisiones vacías, se implementa una arquitectura basada en eventos:
1. **Analítica en el Borde (Edge / Cámara):** Cada cámara ejecuta un algoritmo liviano de detección de movimiento por diferencia de fotogramas. Cuando no hay movimiento, la cámara transmite a una tasa mínima de 1 FPS con baja resolución.
2. **AWS Lambda & Amazon Kinesis Video Streams:** Al detectar movimiento significativo o intrusión, se dispara un evento que activa funciones Lambda para indexar el fragmento y enrutar el flujo a Kinesis Video Streams.
3. **Instancias EC2 Spot con Auto Scaling:**
   - Para las tareas pesadas de transcodificación masiva, compresión y archivado nocturno, se utiliza un grupo de Auto Scaling compuesto por **EC2 Spot Instances** (`c6g.2xlarge` basadas en procesadores AWS Graviton3).
   - Las instancias Spot ofrecen un **descuento del 70% al 90%** comparadas con las instancias On-Demand.
   - En caso de interrupción de una instancia Spot, el balanceador de carga redirige el trabajo al pool de reserva sin pérdida de datos gracias al buffer de Kinesis.
4. **Migración a Códec H.265 / HEVC:**
   - Sustitución del códec H.264 por H.265, logrando una **reducción del 50% en tasa de bits (bitrate)** manteniendo idéntica calidad visual 1080p y 4K UHD.

---

## 4. Pirámide Jerárquica de Almacenamiento (S3, EBS y Glacier)

Se elimina el almacenamiento de grabaciones en discos EBS. Los discos EBS se reducen a volúmenes mínimos de 30 GB únicamente para el sistema operativo de los nodos trabajadores. Todo el video se transfiere inmediatamente a **Amazon S3** gobernado por **Reglas de Ciclo de Vida (S3 Lifecycle Rules)**:

```
[ Cámaras IP / Agentes VMS ]
            │ (Stream H.265)
            ▼
[ Amazon S3 Standard (Hot) ] ──(Día 7)──► [ S3 Standard-IA (Warm) ] ──(Día 30)──► [ S3 Glacier Flexible (Cold) ] ──(Día 180)──► [ S3 Glacier Deep Archive ]
   $0.023 / GB-mes                           $0.0125 / GB-mes                         $0.0036 / GB-mes                             $0.00099 / GB-mes
   - Monitoreo en vivo                       - Búsquedas forenses del mes             - Retención legal e historial                - Archivo histórico de largo plazo
   - Analítica en tiempo real                 - Acceso en milisegundos                 - Recuperación en 3 a 5 horas                - Recuperación en 12 horas
```

### Ahorro Obtenido en Almacenamiento:
- **Antes (EBS gp3 para todo el histórico):** 65,000 GB × \$0.08 = **\$5,200 USD/mes**.
- **Después (Pirámide S3 + Glacier):**
  - S3 Hot (10% de grabaciones): 6,500 GB × \$0.023 = \$149.50
  - S3 Warm (25% de grabaciones): 16,250 GB × \$0.0125 = \$203.12
  - S3 Glacier (65% de grabaciones): 42,250 GB × \$0.0036 = \$152.10
  - Subtotal almacenamiento: **\$504.72 USD/mes** (¡Ahorro del **90.3%** en almacenamiento!).

---

## 5. Estructura de Base de Datos Optimizada: Amazon Aurora PostgreSQL

### 5.1. Desacoplamiento Total de Datos
- **Almacenamiento de Video:** El video y las capturas de imagen residen exclusivamente en S3. En la base de datos **nunca** se almacenan objetos binarios (BLOBs).
- **Almacenamiento de Metadatos en Aurora:** La base de datos almacena únicamente registros livianos:
  - `camera_id`, `timestamp`, `event_type`, `confidence_score`, `bounding_box_coords`, `s3_presigned_url`, `sha256_hash`.

### 5.2. Alta Disponibilidad y Rendimiento
- **Despliegue Multi-AZ:** Replicación sincrónica automática en dos zonas de disponibilidad (AZ) para tolerancia a fallas de infraestructura.
- **Read Replicas Dedicadas:** El panel del SOC y las búsquedas de los operadores consultan las réplicas de lectura, liberando el 100% de la capacidad de escritura del nodo primario para la inserción continua de eventos y telemetría.
- **Particionamiento Mensual de Tablas:** La tabla `cctv_incident_events` se particiona por rangos de fecha (`RANGE (timestamp)`). Las consultas forenses solo escanean la partición del mes correspondiente.
- **Amazon RDS Proxy:** Agrupa y reutiliza conexiones para evitar saturación de sockets provocada por microservicios y funciones Lambda.

---

## 6. Estrategia de Seguridad Integral (IAM, VPC, KMS)

1. **Principio de Menor Privilegio (IAM):**
   - **Rol Operador SOC:** Acceso exclusivo de solo lectura a transmisiones en vivo y confirmación de alarmas.
   - **Rol Auditor Forense:** Acceso de lectura a bitácoras de auditoría de AWS CloudTrail y generación de informes forenses firmados.
   - **Rol Administrador Cloud:** Gestión de infraestructura protegida obligatoriamente con autenticación multifactor (MFA).
2. **Segmentación de Red con Amazon VPC Privada:**
   - Toda la flota de procesamiento y almacenamiento se aísla en **Subnets Privadas** sin direcciones IP públicas.
   - La comunicación hacia Amazon S3 se realiza mediante **VPC Gateway Endpoints**, eliminando el tráfico por Internet y ahorrando los costos de procesamiento de NAT Gateways.
3. **Cifrado de Extremo a Extremo:**
   - **En tránsito:** TLS 1.3 forzado en todas las conexiones WebRTC, RTSP y HTTPS con certificados gestionados por AWS Certificate Manager (ACM).
   - **En reposo:** Cifrado automático con **AWS KMS (Key Management Service)** usando claves administradas por el cliente (CMK) con rotación automática anual.
4. **Protección Perimetral:**
   - Implementación de **AWS WAF** para filtrar inyecciones SQL, ataques de fuerza bruta y peticiones anómalas.
   - Activación de **AWS Shield Standard** para mitigación automática de ataques DDoS.

---

## 7. Automatización con AWS Systems Manager (SSM)

Para eliminar la administración artesanal y el riesgo de accesos SSH descontrolados:
- **SSM Run Command:** Permite ejecutar diagnósticos masivos y actualizaciones de configuración en cientos de dispositivos de videovigilancia simultáneamente sin abrir puertos entrantes.
- **SSM Patch Manager:** Orquesta la aplicación automatizada de parches de seguridad del sistema operativo y kernels en ventanas de mantenimiento nocturnas con reinicios controlados.
- **SSM Session Manager:** Reemplaza el protocolo SSH tradicional. Brinda acceso a consolas shell autenticado mediante IAM, registrando todas las pulsaciones de teclas y comandos ejecutados en Amazon CloudWatch Logs para auditoría forense inmutable.

---

## 8. Cuadro Comparativo de Costos y Beneficios

| Concepto | Costo Antes (AWS Sin Optimizar) | Costo Después (Propuesta VIGILA) | Ahorro Mensual | Ahorro Anual |
| :--- | :--- | :--- | :--- | :--- |
| **Cómputo (EC2/Lambda)** | \$2,448.00 | \$734.00 | \$1,714.00 (70.0%) | \$20,568.00 |
| **Almacenamiento (EBS vs S3/Glacier)** | \$5,200.00 | \$1,616.00 | \$3,584.00 (68.9%) | \$43,008.00 |
| **Red & Egress (H.264 vs H.265/CloudFront)** | \$3,100.00 | \$800.00 | \$2,300.00 (74.2%) | \$27,600.00 |
| **TOTAL MENSUAL** | **\$10,748.00 USD** | **\$3,150.00 USD** | **\$7,598.00 USD** | **\$91,176.00 USD** |

### **Porcentaje Total de Ahorro: 70.7%**

---

## 9. Descripción del Prototipo Práctico Desarrollado (Software VIGILA)

Para evidenciar de manera tangible y profesional todos los conceptos teóricos sin generar gastos en una tarjeta de crédito en AWS, se desarrolló la plataforma **VIGILA Cloud Surveillance (Enterprise VMS)**:

1. **Monitoreo en Vivo Multi-Cámara (SOC Real-Time Grid):**
   - Transmisión simultánea de 6 cámaras de seguridad en tiempo real.
   - **Integración con Cámara Web Real:** Permite al usuario/profesor encender su propia webcam local en la **CAM-01** y experimentar la visión computacional en vivo.
   - **Cámaras Simuladas Hiperrealistas en HTML5 Canvas:** Renderizado dinámico de Centro de Cómputo (servidores, luces LED, técnicos), Lobby de Acceso (torniquetes, visitantes con credencial), Perímetro Exterior (visión nocturna infrarroja con patrullas) y Bóveda de Seguridad (barreras láser).
2. **Motor de Visión Computacional & Detección de Movimiento:**
   - Detección de movimiento por diferencia de fotogramas en tiempo real. Al mover la mano frente a la webcam o detectar movimiento en el canvas, dibuja cajas delimitadoras (bounding boxes) en rojo/verde y genera alarmas sonoras mediante el sintetizador Web Audio API.
3. **Controles PTZ Digitales (Pan / Tilt / Zoom):**
   - Joystick interactivo de paneo horizontal, inclinación vertical y zoom óptico hasta 3.5x para inspección pericial.
4. **Calculadora Interactiva de Costos Cloud:**
   - Slider dinámico (de 10 a 500 cámaras) que recalcula en tiempo real los costos de cómputo, almacenamiento y egress entre la infraestructura no optimizada y la optimizada.
5. **Simulador de AWS Systems Manager (SSM):**
   - Consola interactiva para ejecutar tareas automatizadas de mantenimiento y rotación de llaves KMS con verificación visual de registros.
6. **Bóveda de Evidencias y Generación de Reportes Forenses:**
   - Captura de instantáneas forenses con marca de agua inmutable (marca de tiempo milimétrica, ID de cámara y hash criptográfico) y botón de exportación directa a informe formal imprimible en PDF.

