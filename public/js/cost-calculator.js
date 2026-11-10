/**
 * VIGILA Cloud Surveillance - AWS Cost & Architecture Calculator
 * Dynamically estimates AWS monthly expenses for unoptimized vs optimized architectures.
 */

class CostCalculator {
  constructor() {
    this.slider = document.getElementById('cam-count-slider');
    this.displayCamCount = document.getElementById('cam-count-display');
    this.displayUnopt = document.getElementById('calc-unopt');
    this.displayOpt = document.getElementById('calc-opt');
    this.displaySavings = document.getElementById('calc-savings');
  }

  init() {
    if (!this.slider) return;

    this.slider.addEventListener('input', (e) => {
      this.calculate(parseInt(e.target.value, 10));
    });

    // Initial calculation
    this.calculate(parseInt(this.slider.value, 10));
  }

  calculate(cameras) {
    if (this.displayCamCount) {
      this.displayCamCount.textContent = `${cameras} Cámaras`;
    }

    // --- ARQUITECTURA NO OPTIMIZADA (CASO VIGILA INICIAL) ---
    // 1 instancia EC2 c5.2xlarge fija por cada 2.5 cámaras (~$245/mes cada una)
    const ec2InstancesUnopt = Math.ceil(cameras / 2.5);
    const computeUnopt = ec2InstancesUnopt * 244.80;

    // Almacenamiento continuo sin filtrar en discos EBS gp3 (~150 GB por cámara / mes @ $0.08/GB)
    const ebsStorageUnopt = cameras * 150 * 0.08;

    // Tráfico de egress de video H.264 sin compresión adaptativa (~$62/cámara)
    const egressUnopt = cameras * 62.00;

    const totalUnopt = computeUnopt + ebsStorageUnopt + egressUnopt;

    // --- ARQUITECTURA OPTIMIZADA PROPUESTA (VIGILA CLOUD) ---
    // 1. Cómputo: AWS Lambda guiado por movimiento + Instancias Spot EC2 (Ahorro ~70%)
    const computeOpt = computeUnopt * 0.30;

    // 2. Almacenamiento: S3 Intelligent-Tiering + Ciclo de vida a Glacier Flexible Archive (Ahorro ~69%)
    // 7 días Hot ($0.023) + 23 días Warm ($0.0125) + Glacier ($0.0036)
    const storageOpt = ebsStorageUnopt * 0.31;

    // 3. Red: H.265 / HEVC (50% menos ancho de banda) + CDN CloudFront (Ahorro ~74%)
    const egressOpt = egressUnopt * 0.258;

    const totalOpt = computeOpt + storageOpt + egressOpt;
    const monthlySavings = totalUnopt - totalOpt;
    const annualSavings = monthlySavings * 12;

    // Format currency
    const formatUSD = (val) => '$' + Math.round(val).toLocaleString('en-US');

    if (this.displayUnopt) this.displayUnopt.textContent = `${formatUSD(totalUnopt)} / mes`;
    if (this.displayOpt) this.displayOpt.textContent = `${formatUSD(totalOpt)} / mes`;
    if (this.displaySavings) this.displaySavings.textContent = `${formatUSD(annualSavings)} / año (-70.7%)`;
  }
}

window.CostCalculator = CostCalculator;

