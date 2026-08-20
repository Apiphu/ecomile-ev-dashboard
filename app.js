// Initialize Lucide Icons
lucide.createIcons();

// --- STATE MANAGEMENT ---
const state = {
  speed: 0,
  targetSpeed: 0,
  maxSpeed: 0,
  gear: 'D',
  driveMode: 'SPORT', // ECO, NORMAL, SPORT
  rpm: 0,
  motorTemp: 42.5,
  motorPowerKw: 0.0,
  motorTorque: 0,
  
  // STM32 Quad Module Temperatures (ยฐC)
  moduleTemps: [34.5, 38.2, 32.8, 31.4],
  moduleNames: ['BMU Master (STM32F4)', 'Inverter Core (STM32G4)', 'Vehicle VCU (STM32H7)', 'Gateway/IoT (STM32F1)'],
  
  // Battery & Energy
  batteryPct: 85,
  batteryVoltage: 392.4,
  estimatedRange: 340,
  totalKwh: 1.42,
  regenKwh: 0.38,
  instantKw: 0.0,
  
  // Simulation Config
  isAutoSim: true,
  overheatTriggered: false,
  simTime: 0,
  historyPoints: 20,

  // Live 0-100 km/h Drag Telemetry Timer
  accelState: 'IDLE', // 'IDLE', 'COUNTING', 'FINISHED'
  accelStartTime: 0,
  accelLastRecorded: 3.42
};

// --- CHART INITIALIZATION (Chart.js) ---
const ctx = document.getElementById('energyChart').getContext('2d');
const chartGradient = ctx.createLinearGradient(0, 0, 0, 200);
chartGradient.addColorStop(0, 'rgba(0, 230, 118, 0.35)');
chartGradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');

const chartPowerGradient = ctx.createLinearGradient(0, 0, 0, 200);
chartPowerGradient.addColorStop(0, 'rgba(246, 173, 85, 0.35)');
chartPowerGradient.addColorStop(1, 'rgba(246, 173, 85, 0.0)');

const energyChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(state.historyPoints).fill(''),
    datasets: [
      {
        label: 'Speed (km/h)',
        data: Array(state.historyPoints).fill(0),
        borderColor: '#00e676',
        backgroundColor: chartGradient,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y'
      },
      {
        label: 'Power (kW)',
        data: Array(state.historyPoints).fill(0),
        borderColor: '#f6ad55',
        backgroundColor: chartPowerGradient,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          boxWidth: 12
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { display: false }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 200,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: -30,
        max: 120,
        grid: { drawOnChartArea: false },
        ticks: { color: '#f6ad55', font: { size: 10 } }
      }
    }
  }
});

// --- DOM ELEMENTS CACHE ---
const elSpeedValue = document.getElementById('speed-value');
const elSpeedRing = document.getElementById('speed-ring');
const elMaxSpeed = document.getElementById('max-speed-stat');
const elAccelStat = document.getElementById('accel-stat');
const elRpmValue = document.getElementById('rpm-value');
const elRpmBar = document.getElementById('rpm-bar');
const elMotorTemp = document.getElementById('motor-temp-value');
const elMotorTempStatus = document.getElementById('motor-temp-status');
const elMotorPower = document.getElementById('motor-power-kw');
const elMotorTorque = document.getElementById('motor-torque');
const elBatteryPct = document.getElementById('battery-pct');
const elBatteryBar = document.getElementById('battery-bar');
const elRangeKm = document.getElementById('range-km');
const elBatteryVoltage = document.getElementById('battery-voltage');
const elInstantPower = document.getElementById('instant-power');
const elTotalKwh = document.getElementById('total-kwh');
const elRegenKwh = document.getElementById('regen-kwh');
const elAvgConsumption = document.getElementById('avg-consumption');
const elLiveClock = document.getElementById('live-clock');
const elTelemetryLatency = document.getElementById('telemetry-latency');
const elHeaderDriveMode = document.getElementById('header-drive-mode');
const elSpeedSlider = document.getElementById('speed-slider');
const elSliderSpeedVal = document.getElementById('slider-speed-val');
const elBatterySlider = document.getElementById('battery-slider');
const elSliderBatteryVal = document.getElementById('slider-battery-val');
const elAutoSimBtn = document.getElementById('btn-auto-sim');
const elAutoSimLabel = document.getElementById('auto-sim-label');
const elAutoSimIcon = document.getElementById('auto-sim-icon');
const elTriggerAlertBtn = document.getElementById('btn-trigger-alert');
const elAlertsContainer = document.getElementById('alerts-container');
const elClearAlertsBtn = document.getElementById('clear-alerts-btn');

// --- SIMULATION & TELEMETRY ENGINE ---
function updateClock() {
  const now = new Date();
  elLiveClock.textContent = now.toTimeString().split(' ')[0];
  elTelemetryLatency.textContent = Math.floor(10 + Math.random() * 8);
}
setInterval(updateClock, 1000);
updateClock();

// Auto Driving Cycle Generator (Mockup Physics)
function runSimulationCycle() {
  state.simTime += 0.2;
  
  if (state.isAutoSim) {
    // Realistic multi-phase driving cycle (Stop -> Sprint -> Cruise -> Regen Stop)
    const cyclePhase = (state.simTime % 22); // 22-second full drive cycle
    let target = 0;
    
    if (cyclePhase < 2.0) {
      target = 0; // 🛑 Complete Stop (Reset for next launch run)
    } else if (cyclePhase < 7.5) {
      // 🚀 Full Throttle Sprint 0 to 145 km/h
      const progress = (cyclePhase - 2.0) / 5.5;
      target = Math.min(160, progress * 150);
    } else if (cyclePhase < 14.0) {
      // 🏎️ High-Speed Highway Cruising
      target = 130 + Math.sin(state.simTime * 0.5) * 15;
    } else {
      // ⚡ Regenerative Deceleration back to 0
      const progress = (cyclePhase - 14.0) / 8.0;
      target = Math.max(0, 130 * (1 - progress));
    }
    
    state.targetSpeed = target;
    elSpeedSlider.value = Math.round(state.targetSpeed);
    elSliderSpeedVal.textContent = `${Math.round(state.targetSpeed)} km/h`;
  } else {
    state.targetSpeed = parseFloat(elSpeedSlider.value);
  }

  // Smooth Speed Transition
  state.speed += (state.targetSpeed - state.speed) * 0.22;
  if (state.speed < 0.5) state.speed = 0;
  
  // Live 0-100 km/h & Peak Speed Fresh Session Tracker
  if (state.speed <= 0.5) {
    // When vehicle is stopped, ready for next drive session
    state.readyForNewRun = true;
    state.accelState = 'IDLE';
  } else if (state.speed > 1.0) {
    if (state.readyForNewRun) {
      // 🏁 New launch sprint started! Reset Peak Speed & Start 0-100 timer fresh
      state.readyForNewRun = false;
      state.maxSpeed = Math.round(state.speed);
      if (elMaxSpeed) elMaxSpeed.textContent = `${state.maxSpeed} km/h`;
      
      state.accelState = 'COUNTING';
      state.accelStartTime = performance.now();
      if (elAccelStat) elAccelStat.textContent = '0.00s';
    } else {
      // Track peak speed for this driving run
      if (state.speed > state.maxSpeed) {
        state.maxSpeed = Math.round(state.speed);
        if (elMaxSpeed) elMaxSpeed.textContent = `${state.maxSpeed} km/h`;
      }
    }

    // Stopwatch ticking during 0 to 100 sprint
    if (state.speed < 100 && state.accelState === 'COUNTING') {
      const elapsedSec = ((performance.now() - state.accelStartTime) / 1000).toFixed(2);
      if (elAccelStat) {
        elAccelStat.textContent = `${elapsedSec}s`;
        elAccelStat.className = 'font-mono text-amber-400 font-bold ml-1 animate-pulse';
      }
    } else if (state.speed >= 100 && state.accelState === 'COUNTING') {
      // 🎯 100 km/h Reached! Lock sprint time record
      const elapsedSec = ((performance.now() - state.accelStartTime) / 1000).toFixed(2);
      state.accelLastRecorded = elapsedSec;
      state.accelState = 'FINISHED';
      if (elAccelStat) {
        elAccelStat.textContent = `${elapsedSec}s`;
        elAccelStat.className = 'font-mono text-emerald-400 font-bold ml-1';
      }
      addAlert('0-100 km/h Sprint Record!', `ทำอัตราเร่ง 0-100 รอบใหม่ได้ ${elapsedSec} วินาที (${state.driveMode} Mode)`, 'success');
    }
  }

  if (state.accelState !== 'COUNTING' && elAccelStat) {
    elAccelStat.textContent = `${state.accelLastRecorded}s`;
    elAccelStat.className = 'font-mono text-emerald-400 font-bold ml-1';
  }

  // Drive Mode Multiplier
  let modeMultiplier = 1.0;
  if (state.driveMode === 'ECO') modeMultiplier = 0.8;
  if (state.driveMode === 'SPORT') modeMultiplier = 1.35;

  // Calculate Motor RPM (Gear ratio ~ 1:8.5, Tire ~ 0.3m radius)
  state.rpm = Math.round((state.speed * 52.5) + (Math.random() * 30 - 15));
  if (state.speed <= 0.5) state.rpm = 0;

  // Calculate Instant Power & Energy
  const acceleration = (state.targetSpeed - state.speed);
  if (acceleration > 0.5) {
    // Accelerating: Consuming Power
    state.instantKw = Math.min(115, Math.max(2, (state.speed * 0.45 + acceleration * 2.8) * modeMultiplier));
    state.totalKwh += (state.instantKw / 3600) * 0.1;
  } else if (acceleration < -1.0 && state.speed > 5) {
    // Decelerating: Regenerative Braking!
    state.instantKw = Math.max(-28, acceleration * 1.5);
    state.regenKwh += (Math.abs(state.instantKw) / 3600) * 0.1;
  } else {
    // Cruising
    state.instantKw = Math.max(1.2, state.speed * 0.18 * modeMultiplier);
    state.totalKwh += (state.instantKw / 3600) * 0.1;
  }

  // Motor Torque (Nm)
  state.motorTorque = state.rpm > 50 ? Math.round((state.instantKw * 9548.8) / state.rpm) : 0;
  state.motorPowerKw = Math.abs(state.instantKw).toFixed(1);

  // Motor Temperature (ยฐC)
  let targetMotorTemp = 38 + (state.speed * 0.2) * modeMultiplier;
  if (state.overheatTriggered) targetMotorTemp = 88.5;
  state.motorTemp += (targetMotorTemp - state.motorTemp) * 0.05;

  // Update STM32 Quad Module Temperatures (ยฐC)
  for (let i = 0; i < 4; i++) {
    let targetModTemp = 31 + (i * 2.2) + (state.speed * 0.08);
    if (state.overheatTriggered && i === 1) targetModTemp = 78.4; // Module 2 Overheat
    state.moduleTemps[i] += (targetModTemp - state.moduleTemps[i]) * 0.04 + (Math.random() * 0.2 - 0.1);
  }

  // Battery Drain calculation
  if (!state.isAutoSim) {
    state.batteryPct = parseFloat(elBatterySlider.value);
  } else {
    state.batteryPct = Math.max(2, state.batteryPct - (state.instantKw > 0 ? 0.003 : -0.001));
    elBatterySlider.value = state.batteryPct.toFixed(1);
    elSliderBatteryVal.textContent = `${Math.round(state.batteryPct)}%`;
  }

  // Battery Voltage & Estimated Range calculation
  state.batteryVoltage = (350 + (state.batteryPct / 100) * 50 - (state.instantKw * 0.1)).toFixed(1);
  state.estimatedRange = Math.round((state.batteryPct * 4.1) * (1 / modeMultiplier));

  // Render UI
  renderUI();
}

// --- RENDER UI FUNCTION ---
function renderUI() {
  const currentSpeed = Math.round(state.speed);
  elSpeedValue.textContent = currentSpeed;
  
  // Speed Arc calculation (SVG circumference ~ 490)
  // Max speed scale = 200 km/h
  const maxDashoffset = 490;
  const targetOffset = maxDashoffset - ((state.speed / 200) * 368);
  elSpeedRing.style.strokeDashoffset = Math.max(122, Math.min(490, targetOffset));

  // Motor RPM
  elRpmValue.textContent = state.rpm.toLocaleString();
  const rpmPct = Math.min(100, (state.rpm / 10000) * 100);
  elRpmBar.style.width = `${rpmPct}%`;

  // Motor Temp
  elMotorTemp.textContent = state.motorTemp.toFixed(1);
  if (state.motorTemp > 75) {
    elMotorTempStatus.textContent = 'HIGH TEMP WARNING';
    elMotorTempStatus.className = 'text-[10px] font-mono text-red-400 font-bold animate-pulse';
  } else {
    elMotorTempStatus.textContent = 'NORMAL';
    elMotorTempStatus.className = 'text-[10px] font-mono text-emerald-400';
  }

  // Motor Power & Torque
  elMotorPower.textContent = `${state.motorPowerKw} kW`;
  elMotorTorque.textContent = `${state.motorTorque} Nm`;

  // Battery
  const roundedBattery = Math.round(state.batteryPct);
  elBatteryPct.textContent = roundedBattery;
  elBatteryBar.style.width = `${state.batteryPct}%`;
  
  if (state.batteryPct < 20) {
    elBatteryBar.className = 'h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300';
    elBatteryPct.className = 'text-4xl font-black font-digital text-red-400 drop-shadow-[0_0_10px_rgba(255,75,75,0.5)]';
  } else {
    elBatteryBar.className = 'h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300';
    elBatteryPct.className = 'text-4xl font-black font-digital text-emerald-400 drop-shadow-[0_0_10px_rgba(0,245,160,0.4)]';
  }

  elRangeKm.textContent = state.estimatedRange;
  elBatteryVoltage.textContent = `${state.batteryVoltage} V`;

  // Energy
  elInstantPower.textContent = `${state.instantKw >= 0 ? '' : '-'}${Math.abs(state.instantKw).toFixed(1)} kW`;
  elTotalKwh.textContent = `${state.totalKwh.toFixed(2)} kWh`;
  elRegenKwh.textContent = `+${state.regenKwh.toFixed(2)} kWh`;
  
  // Calculate average efficiency
  const avgEfficiency = (14.2 + (state.speed * 0.04)).toFixed(1);
  elAvgConsumption.textContent = `${avgEfficiency} kWh/100km`;

  // Render 4 STM32 Module Cards
  let totalTemp = 0;
  let hasCriticalModule = false;

  for (let i = 0; i < 4; i++) {
    const modIdx = i + 1;
    const temp = state.moduleTemps[i];
    totalTemp += temp;

    const elTemp = document.getElementById(`temp-mod-${modIdx}`);
    const elBar = document.getElementById(`bar-mod-${modIdx}`);
    const elStatus = document.getElementById(`mod-status-${modIdx}`);
    const elDot = document.getElementById(`mod-dot-${modIdx}`);
    const elCard = document.getElementById(`card-mod-${modIdx}`);

    if (elTemp) elTemp.textContent = temp.toFixed(1);
    if (elBar) elBar.style.width = `${Math.min(100, (temp / 100) * 100)}%`;

    if (temp > 70) {
      hasCriticalModule = true;
      if (elStatus) {
        elStatus.textContent = 'CRITICAL';
        elStatus.className = 'px-2 py-0.5 text-[10px] font-mono rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold';
      }
      if (elBar) elBar.className = 'h-full rounded-full bg-red-500 transition-all duration-300';
      if (elDot) elDot.className = 'w-2 h-2 rounded-full bg-red-400 animate-ping';
      if (elCard) elCard.className = 'p-4 rounded-xl bg-red-950/30 border border-red-500/50 shadow-neon-red transition-all group relative overflow-hidden';
    } else if (temp > 50) {
      if (elStatus) {
        elStatus.textContent = 'WARNING';
        elStatus.className = 'px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold';
      }
      if (elBar) elBar.className = 'h-full rounded-full bg-amber-400 transition-all duration-300';
      if (elDot) elDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      if (elCard) elCard.className = 'p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 transition-all group relative overflow-hidden';
    } else {
      if (elStatus) {
        elStatus.textContent = 'NORMAL';
        elStatus.className = 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
      if (elBar) elBar.className = 'h-full rounded-full bg-emerald-400 transition-all duration-300';
      if (elDot) elDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      if (elCard) elCard.className = 'p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all group relative overflow-hidden';
    }
  }

  // Thermal Overall Summary Badge
  const avgTemp = (totalTemp / 4).toFixed(1);
  const elAvgTempVal = document.getElementById('avg-temp-val');
  const elThermalBadge = document.getElementById('thermal-overall-badge');
  if (elAvgTempVal) elAvgTempVal.textContent = avgTemp;

  if (hasCriticalModule && elThermalBadge) {
    elThermalBadge.className = 'px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse';
    elThermalBadge.innerHTML = `THERMAL ALERT (AVG: <span id="avg-temp-val">${avgTemp}</span>&deg;C)`;
  } else if (elThermalBadge) {
    elThermalBadge.className = 'px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    elThermalBadge.innerHTML = `OPTIMAL (AVG: <span id="avg-temp-val">${avgTemp}</span>&deg;C)`;
  }

  // Update Live Chart
  updateChartData(Math.round(state.speed), parseFloat(state.instantKw.toFixed(1)));
}

// Update Chart Streams
function updateChartData(speedVal, powerVal) {
  const dataSpeed = energyChart.data.datasets[0].data;
  const dataPower = energyChart.data.datasets[1].data;

  dataSpeed.shift();
  dataSpeed.push(speedVal);

  dataPower.shift();
  dataPower.push(powerVal);

  energyChart.update();
}

// Alert Logging System
function addAlert(title, message, type = 'info') {
  const time = new Date().toTimeString().split(' ')[0];
  
  let iconName = 'info';
  let colorClass = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300';
  let iconColor = 'text-emerald-400';

  if (type === 'warning') {
    iconName = 'alert-triangle';
    colorClass = 'bg-amber-500/10 border-amber-500/25 text-amber-300';
    iconColor = 'text-amber-400';
  } else if (type === 'danger') {
    iconName = 'flame';
    colorClass = 'bg-red-500/15 border-red-500/30 text-red-300';
    iconColor = 'text-red-400';
  } else if (type === 'success') {
    iconName = 'check-circle-2';
    colorClass = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300';
    iconColor = 'text-emerald-400';
  }

  const alertItem = document.createElement('div');
  alertItem.className = `p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${colorClass} transition-all animate-fadeIn shadow-sm`;
  alertItem.innerHTML = `
    <div class="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5 alert-icon-box">
      <i data-lucide="${iconName}" class="w-3.5 h-3.5 ${iconColor}"></i>
    </div>
    <div>
      <div class="font-bold alert-title">${title}</div>
      <div class="text-[11px] text-slate-400 font-mono alert-msg">${message}</div>
    </div>
    <span class="ml-auto text-[10px] text-slate-500 font-mono alert-time">${time}</span>
  `;

  elAlertsContainer.prepend(alertItem);
  lucide.createIcons();

  // Limit alerts count to 15
  while (elAlertsContainer.children.length > 15) {
    elAlertsContainer.removeChild(elAlertsContainer.lastChild);
  }
}

// --- EVENT LISTENERS ---

// Auto Sim Toggle
elAutoSimBtn.addEventListener('click', () => {
  state.isAutoSim = !state.isAutoSim;
  if (state.isAutoSim) {
    elAutoSimLabel.textContent = 'Auto Simulation: Active';
    elAutoSimBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-400 text-black hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-neon-cyan';
    addAlert('Auto Simulation Resumed', 'Automated drive cycle simulation active', 'info');
  } else {
    elAutoSimLabel.textContent = 'Manual Mode (Paused)';
    elAutoSimBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5';
    addAlert('Manual Control Engaged', 'Driver throttle slider is now in control', 'info');
  }
  lucide.createIcons();
});

// Function to switch to Manual Mode
function activateManualSpeed(value) {
  if (state.isAutoSim) {
    state.isAutoSim = false;
    elAutoSimLabel.textContent = 'Manual Mode (Paused)';
    elAutoSimBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5';
    addAlert('Manual Control Engaged', 'คุณกำลังควบคุมอัตราเร่งด้วยตัวเองผ่านสไลเดอร์', 'info');
    lucide.createIcons();
  }
  state.targetSpeed = parseFloat(value);
  elSliderSpeedVal.textContent = `${Math.round(state.targetSpeed)} km/h`;
}

// Speed Slider Events (Smooth Dragging)
elSpeedSlider.addEventListener('input', (e) => {
  activateManualSpeed(e.target.value);
});

elSpeedSlider.addEventListener('mousedown', (e) => {
  activateManualSpeed(e.target.value);
});

elSpeedSlider.addEventListener('touchstart', (e) => {
  activateManualSpeed(e.target.value);
}, { passive: true });

// Battery Slider
elBatterySlider.addEventListener('input', (e) => {
  state.batteryPct = parseFloat(e.target.value);
  elSliderBatteryVal.textContent = `${Math.round(state.batteryPct)}%`;
  
  if (state.batteryPct < 20) {
    addAlert('Low Battery Warning', `Battery State of Charge critically low (${Math.round(state.batteryPct)}%)`, 'warning');
  }
});

// Drive Mode Buttons
document.querySelectorAll('.drive-mode-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const mode = e.currentTarget.getAttribute('data-mode');
    state.driveMode = mode;
    elHeaderDriveMode.textContent = mode;

    document.querySelectorAll('.drive-mode-btn').forEach(b => {
      b.className = 'drive-mode-btn py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all';
    });

    // Update Dynamic 0-100 Acceleration Profile
    if (elAccelStat) {
      if (mode === 'SPORT') elAccelStat.textContent = '3.2s';
      else if (mode === 'NORMAL') elAccelStat.textContent = '4.2s';
      else if (mode === 'ECO') elAccelStat.textContent = '5.6s';
    }

    addAlert(`Drive Mode Changed: ${mode}`, `Throttle mapping tuned (${mode === 'SPORT' ? '0-100: 3.2s' : mode === 'NORMAL' ? '0-100: 4.2s' : '0-100: 5.6s'})`, 'info');
  });
});

// Click Peak Speed to Reset Record
if (elMaxSpeed) {
  elMaxSpeed.parentElement.style.cursor = 'pointer';
  elMaxSpeed.parentElement.title = 'คลิกเพื่อรีเซ็ตสถิติความเร็วสูงสุด';
  elMaxSpeed.parentElement.addEventListener('click', () => {
    state.maxSpeed = Math.round(state.speed);
    elMaxSpeed.textContent = `${state.maxSpeed} km/h`;
    addAlert('Peak Speed Reset', `สถิติความเร็วสูงสุดถูกรีเซ็ตเป็น ${state.maxSpeed} km/h`, 'info');
  });
}

// Theme Toggle (Dark Mode / Light Mode)
const elThemeBtn = document.getElementById('theme-toggle-btn');
const elThemeLabel = document.getElementById('theme-label');
let isDarkMode = true;

if (elThemeBtn) {
  elThemeBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (!isDarkMode) {
      // Switch to Light Theme
      document.body.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
      elThemeBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 border border-slate-300 text-slate-800 hover:bg-slate-300 transition-all cursor-pointer shadow-sm';
      elThemeBtn.innerHTML = `<i data-lucide="moon" class="w-4 h-4 text-slate-800"></i><span class="text-xs font-bold text-slate-800" id="theme-label">Dark Mode</span>`;
      
      // Update Chart Colors for Light Background
      energyChart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.06)';
      energyChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.06)';
      energyChart.options.scales.y.ticks.color = '#475569';
      energyChart.options.plugins.legend.labels.color = '#334155';
      energyChart.update();

      addAlert('Theme Changed', 'โหมดพื้นหลังสีขาว (Light Mode) เปิดใช้งานแล้ว', 'info');
    } else {
      // Switch to Dark Theme
      document.body.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
      elThemeBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/50 text-amber-400 hover:text-amber-300 transition-all cursor-pointer shadow-sm';
      elThemeBtn.innerHTML = `<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i><span class="text-xs font-semibold text-slate-300" id="theme-label">Light Mode</span>`;
      
      // Update Chart Colors for Dark Background
      energyChart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.05)';
      energyChart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.05)';
      energyChart.options.scales.y.ticks.color = '#64748b';
      energyChart.options.plugins.legend.labels.color = '#94a3b8';
      energyChart.update();

      addAlert('Theme Changed', 'โหมดพื้นหลังสีดำ (Dark Mode) เปิดใช้งานแล้ว', 'info');
    }
    lucide.createIcons();
  });
}

// Overheat Alert Test Button
elTriggerAlertBtn.addEventListener('click', () => {
  state.overheatTriggered = !state.overheatTriggered;
  
  if (state.overheatTriggered) {
    elTriggerAlertBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white shadow-neon-red transition-all flex items-center gap-1.5 animate-pulse';
    elTriggerAlertBtn.querySelector('span').textContent = 'Cool Down Module';
    addAlert('CRITICAL OVERHEAT ALERT!', 'STM32 Module 02 (Inverter Core) exceeded 75°C threshold!', 'danger');
  } else {
    elTriggerAlertBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1.5';
    elTriggerAlertBtn.querySelector('span').textContent = 'Test Overheat Alert';
    addAlert('Thermal Recovery Active', 'STM32 Module 02 cooling cycle normalized', 'success');
  }
});

// Clear Alerts
elClearAlertsBtn.addEventListener('click', () => {
  elAlertsContainer.innerHTML = '';
  addAlert('System Log Cleared', 'Alert feed refreshed', 'info');
});

// --- MAIN LOOP ---
setInterval(runSimulationCycle, 150);