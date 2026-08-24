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
  
  // STM32 Quad Module Temperatures (°C)
  moduleTemps: [34.5, 38.2, 32.8, 31.4],
  moduleNames: ['BMU Master (STM32F4)', 'Inverter Core (STM32G4)', 'Vehicle VCU (STM32H7)', 'Gateway/IoT (STM32F1)'],
  
  // Battery & Energy Telemetry
  batteryPct: 85,
  batteryVoltage: 392.4,
  packCurrent: 0.0,
  cellMinV: 3.821,
  cellMaxV: 3.845,
  cellDeltaV: 0.024,
  estimatedRange: 340,
  totalKwh: 1.42,
  regenKwh: 0.38,
  instantKw: 0.0,
  energyPerLap: 114.5, // Wh/lap
  
  // Race Strategy & Lap Timing
  currentLap: 8,
  totalLaps: 15,
  lapTimeSec: 102.85,
  bestLapSec: 98.20,
  lapDeltaSec: -0.35,
  pitRadioMsg: 'PACE OPTIMAL • LIFT & COAST TURN 4',
  
  // 2D G-Force Dynamics (Lateral & Longitudinal)
  gLat: 0.0,
  gLon: 0.0,
  
  // Simulation Config & 0-100 Stopwatch
  isAutoSim: true,
  overheatTriggered: false,
  simTime: 0,
  historyPoints: 20,
  readyForNewRun: true,
  accelState: 'IDLE', // 'IDLE', 'COUNTING', 'FINISHED'
  accelStartTime: 0,
  accelLastRecorded: 3.42
};

// --- CHART INITIALIZATION (Chart.js) ---
const ctx = document.getElementById('energyChart').getContext('2d');
const chartGradient = ctx.createLinearGradient(0, 0, 0, 180);
chartGradient.addColorStop(0, 'rgba(0, 230, 118, 0.35)');
chartGradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');

const chartPowerGradient = ctx.createLinearGradient(0, 0, 0, 180);
chartPowerGradient.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
chartPowerGradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

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
        borderColor: '#f59e0b',
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
          font: { family: 'Inter', size: 10 },
          boxWidth: 10
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
        ticks: { color: '#64748b', font: { size: 9 } }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: -30,
        max: 120,
        grid: { drawOnChartArea: false },
        ticks: { color: '#f59e0b', font: { size: 9 } }
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
const elMotorTorque = document.getElementById('motor-torque');
const elBatteryPct = document.getElementById('battery-pct');
const elBatteryBar = document.getElementById('battery-bar');
const elRangeKm = document.getElementById('range-km');
const elBatteryVoltage = document.getElementById('battery-voltage');
const elPackCurrent = document.getElementById('pack-current');
const elCellDelta = document.getElementById('cell-delta');
const elCellMinV = document.getElementById('cell-voltage-min');
const elCellMaxV = document.getElementById('cell-voltage-max');
const elInstantPower = document.getElementById('instant-power');
const elTotalKwh = document.getElementById('total-kwh');
const elRegenKwh = document.getElementById('regen-kwh');
const elAvgConsumption = document.getElementById('avg-consumption');
const elLiveClock = document.getElementById('live-clock');
const elTelemetryLatency = document.getElementById('telemetry-latency');
const elHeaderDriveMode = document.getElementById('header-drive-mode');

// Race & Lap DOMs
const elLapCounter = document.getElementById('lap-counter');
const elLapCurrentTime = document.getElementById('lap-current-time');
const elLapBestTime = document.getElementById('lap-best-time');
const elLapDeltaVal = document.getElementById('lap-delta-val');
const elPitRadioMsg = document.getElementById('pit-radio-msg');

// G-Force DOMs
const elGForceDot = document.getElementById('gforce-dot');
const elGLat = document.getElementById('g-lat');
const elGLon = document.getElementById('g-lon');

// Control DOMs
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

// --- HELPER: FORMAT LAP TIME ---
function formatLapTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
}

// --- CLOCK & LATENCY ENGINE ---
function updateClock() {
  const now = new Date();
  elLiveClock.textContent = now.toTimeString().split(' ')[0];
  elTelemetryLatency.textContent = Math.floor(10 + Math.random() * 6);
}
setInterval(updateClock, 1000);
updateClock();

// --- SIMULATION & TELEMETRY ENGINE ---
function runSimulationCycle() {
  state.simTime += 0.2;
  
  if (state.isAutoSim) {
    // Realistic multi-phase racing cycle (Stop -> Sprint -> Fast Turn -> Cruise -> Regen)
    const cyclePhase = (state.simTime % 24);
    let target = 0;
    
    if (cyclePhase < 2.0) {
      target = 0; // Complete stop (Standby for launch)
    } else if (cyclePhase < 8.0) {
      // Full throttle launch 0 to 148 km/h
      const progress = (cyclePhase - 2.0) / 6.0;
      target = Math.min(165, progress * 155);
    } else if (cyclePhase < 15.0) {
      // High-speed racing circuit pace with slight corner decelerations
      target = 135 + Math.sin(state.simTime * 0.7) * 20;
    } else {
      // Regenerative deceleration into pit/hairpin turn
      const progress = (cyclePhase - 15.0) / 9.0;
      target = Math.max(0, 135 * (1 - progress));
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
  
  // --- 0-100 KM/H & PEAK SPEED SESSION TRACKER ---
  if (state.speed <= 0.5) {
    state.readyForNewRun = true;
    state.accelState = 'IDLE';
  } else if (state.speed > 1.0) {
    if (state.readyForNewRun) {
      // New sprint launch!
      state.readyForNewRun = false;
      state.maxSpeed = Math.round(state.speed);
      if (elMaxSpeed) elMaxSpeed.textContent = `${state.maxSpeed} km/h`;
      
      state.accelState = 'COUNTING';
      state.accelStartTime = performance.now();
      if (elAccelStat) elAccelStat.textContent = '0.00s';
    } else {
      if (state.speed > state.maxSpeed) {
        state.maxSpeed = Math.round(state.speed);
        if (elMaxSpeed) elMaxSpeed.textContent = `${state.maxSpeed} km/h`;
      }
    }

    // Stopwatch ticking during 0-100 sprint
    if (state.speed < 100 && state.accelState === 'COUNTING') {
      const elapsedSec = ((performance.now() - state.accelStartTime) / 1000).toFixed(2);
      if (elAccelStat) {
        elAccelStat.textContent = `${elapsedSec}s`;
        elAccelStat.className = 'text-xl font-black font-digital text-amber-400 animate-pulse';
      }
    } else if (state.speed >= 100 && state.accelState === 'COUNTING') {
      // 100 km/h Reached!
      const elapsedSec = ((performance.now() - state.accelStartTime) / 1000).toFixed(2);
      state.accelLastRecorded = elapsedSec;
      state.accelState = 'FINISHED';
      if (elAccelStat) {
        elAccelStat.textContent = `${elapsedSec}s`;
        elAccelStat.className = 'text-xl font-black font-digital text-emerald-400';
      }
      addAlert('0-100 km/h Sprint Record!', `Recorded sprint 0-100 in ${elapsedSec}s (${state.driveMode} Mode)`, 'success');
    }
  }

  if (state.accelState !== 'COUNTING' && elAccelStat) {
    elAccelStat.textContent = `${state.accelLastRecorded}s`;
    elAccelStat.className = 'text-xl font-black font-digital text-emerald-400';
  }

  // --- DRIVE MODE MULTIPLIER ---
  let modeMultiplier = 1.0;
  if (state.driveMode === 'ECO') modeMultiplier = 0.8;
  if (state.driveMode === 'SPORT') modeMultiplier = 1.35;

  // --- MOTOR RPM ---
  state.rpm = Math.round((state.speed * 52.5) + (Math.random() * 20 - 10));
  if (state.speed <= 0.5) state.rpm = 0;

  // --- INSTANT POWER & REGEN ---
  const acceleration = (state.targetSpeed - state.speed);
  if (acceleration > 0.5) {
    state.instantKw = Math.min(115, Math.max(2, (state.speed * 0.45 + acceleration * 2.8) * modeMultiplier));
    state.totalKwh += (state.instantKw / 3600) * 0.1;
  } else if (acceleration < -1.0 && state.speed > 5) {
    // Decelerating: Regenerative Braking
    state.instantKw = Math.max(-28, acceleration * 1.5);
    state.regenKwh += (Math.abs(state.instantKw) / 3600) * 0.1;
  } else {
    state.instantKw = Math.max(1.2, state.speed * 0.18 * modeMultiplier);
    state.totalKwh += (state.instantKw / 3600) * 0.1;
  }

  // --- PACK CURRENT & CELL VOLTAGE ---
  state.packCurrent = (state.instantKw * 1000) / state.batteryVoltage;
  state.motorTorque = state.rpm > 50 ? Math.round((state.instantKw * 9548.8) / state.rpm) : 0;

  // Dynamic Cell Delta
  state.cellMinV = 3.820 + (Math.sin(state.simTime * 0.1) * 0.005);
  state.cellMaxV = state.cellMinV + (0.018 + (state.instantKw > 40 ? 0.015 : 0.006));
  state.cellDeltaV = (state.cellMaxV - state.cellMinV).toFixed(3);

  // --- MOTOR & STM32 TEMPERATURES ---
  let targetMotorTemp = 38 + (state.speed * 0.2) * modeMultiplier;
  if (state.overheatTriggered) targetMotorTemp = 88.5;
  state.motorTemp += (targetMotorTemp - state.motorTemp) * 0.05;

  const baseSTM32Temp = 30 + (state.speed * 0.06);
  state.moduleTemps[0] += ((baseSTM32Temp + 3.5 + (state.overheatTriggered ? 45 : 0)) - state.moduleTemps[0]) * 0.05;
  state.moduleTemps[1] += ((baseSTM32Temp + 7.2 + (state.overheatTriggered ? 52 : 0)) - state.moduleTemps[1]) * 0.05;
  state.moduleTemps[2] += ((baseSTM32Temp + 2.1 + (state.overheatTriggered ? 38 : 0)) - state.moduleTemps[2]) * 0.05;
  state.moduleTemps[3] += ((baseSTM32Temp + 1.0 + (state.overheatTriggered ? 28 : 0)) - state.moduleTemps[3]) * 0.05;

  // --- 2D G-FORCE CALCULATION ---
  // Longitudinal G (Accel / Decel)
  state.gLon = Math.max(-1.2, Math.min(1.1, (acceleration * 0.08) + (Math.random() * 0.04 - 0.02)));
  // Lateral G (Cornering wave)
  state.gLat = state.speed > 10 ? (Math.sin(state.simTime * 0.6) * Math.min(1.2, state.speed * 0.008)) : 0;

  // --- LAP TIMING SIMULATION ---
  if (state.speed > 5) {
    state.lapTimeSec += 0.2;
    if (state.lapTimeSec > 118.0) {
      // Completed Lap!
      state.currentLap++;
      if (state.currentLap > state.totalLaps) state.currentLap = 1;
      
      const prevLapTime = state.lapTimeSec;
      state.lapTimeSec = 0;
      
      // Update Delta
      state.lapDeltaSec = (prevLapTime - state.bestLapSec).toFixed(2);
      if (prevLapTime < state.bestLapSec) {
        state.bestLapSec = prevLapTime;
        state.lapDeltaSec = '-0.00';
        addAlert('🏆 New Best Lap Record!', `Best Lap Time: ${formatLapTime(state.bestLapSec)}!`, 'success');
      } else {
        addAlert(`Lap ${state.currentLap - 1} Completed`, `Lap Time: ${formatLapTime(prevLapTime)} (Delta: +${state.lapDeltaSec}s)`, 'info');
      }
    }
  }

  // Push to Real-time Chart
  updateChartData(Math.round(state.speed), Math.round(state.instantKw));

  renderUI();
}

// --- RENDER UI FUNCTION ---
function renderUI() {
  const currentSpeed = Math.round(state.speed);
  elSpeedValue.textContent = currentSpeed;
  
  // Speed Arc calculation (SVG circumference ~ 490)
  const maxDashoffset = 490;
  const targetOffset = maxDashoffset - ((state.speed / 200) * 368);
  elSpeedRing.style.strokeDashoffset = Math.max(122, Math.min(490, targetOffset));

  // Motor RPM
  elRpmValue.textContent = state.rpm.toLocaleString();
  const rpmPct = Math.min(100, (state.rpm / 10000) * 100);
  elRpmBar.style.width = `${rpmPct}%`;

  // Motor Temp & Torque
  elMotorTemp.textContent = state.motorTemp.toFixed(1);
  elMotorTorque.textContent = `${state.motorTorque} Nm`;

  // Battery
  const roundedBattery = Math.round(state.batteryPct);
  elBatteryPct.textContent = roundedBattery;
  elBatteryBar.style.width = `${state.batteryPct}%`;
  
  if (state.batteryPct < 20) {
    elBatteryBar.className = 'h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300';
    elBatteryPct.className = 'text-3xl font-black font-digital text-red-400 drop-shadow-[0_0_10px_rgba(255,75,75,0.5)]';
  } else {
    elBatteryBar.className = 'h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300';
    elBatteryPct.className = 'text-3xl font-black font-digital text-emerald-400 drop-shadow-[0_0_10px_rgba(0,245,160,0.4)]';
  }

  elRangeKm.textContent = state.estimatedRange;
  elBatteryVoltage.textContent = `${state.batteryVoltage} V`;
  
  // Pack Current (A)
  if (elPackCurrent) {
    const isCharging = state.packCurrent < 0;
    elPackCurrent.textContent = `${isCharging ? '-' : '+'}${Math.abs(state.packCurrent).toFixed(1)} A`;
    elPackCurrent.className = isCharging ? 'font-digital font-black text-emerald-400 text-lg sm:text-xl' : 'font-digital font-black text-amber-400 text-lg sm:text-xl';
  }

  // Cell Delta Balance
  if (elCellDelta) {
    elCellDelta.textContent = `${state.cellDeltaV} V (${state.cellDeltaV < 0.035 ? 'BALANCED' : 'CHECK'})`;
    elCellMinV.textContent = `${state.cellMinV.toFixed(3)} V`;
    elCellMaxV.textContent = `${state.cellMaxV.toFixed(3)} V`;
  }

  // Energy Power
  elInstantPower.textContent = `${state.instantKw >= 0 ? '' : '-'}${Math.abs(state.instantKw).toFixed(1)} kW`;
  elTotalKwh.textContent = `${state.totalKwh.toFixed(2)} kWh`;
  elRegenKwh.textContent = `+${state.regenKwh.toFixed(2)} kWh`;
  
  const avgEfficiency = (14.2 + (state.speed * 0.04)).toFixed(1);
  elAvgConsumption.textContent = `${avgEfficiency} kWh/100km`;

  // --- LAP TIMING RENDER ---
  if (elLapCounter) elLapCounter.textContent = `${state.currentLap} / ${state.totalLaps}`;
  if (elLapCurrentTime) elLapCurrentTime.textContent = formatLapTime(state.lapTimeSec);
  if (elLapBestTime) elLapBestTime.textContent = formatLapTime(state.bestLapSec);
  if (elLapDeltaVal) {
    const numDelta = parseFloat(state.lapDeltaSec);
    elLapDeltaVal.textContent = `${numDelta <= 0 ? '' : '+'}${state.lapDeltaSec}s`;
    elLapDeltaVal.className = numDelta <= 0 ? 'font-bold font-digital text-xs text-emerald-400' : 'font-bold font-digital text-xs text-amber-400';
  }

  // --- 2D G-FORCE RADAR RENDER ---
  if (elGForceDot) {
    // Map G-Force (-1.2 to +1.2) to container coordinates (10% to 90%)
    const dotLeft = Math.max(12, Math.min(88, 50 + (state.gLat * 32)));
    const dotTop = Math.max(12, Math.min(88, 50 - (state.gLon * 32)));
    elGForceDot.style.left = `${dotLeft}%`;
    elGForceDot.style.top = `${dotTop}%`;
    
    if (elGLat) elGLat.textContent = `${state.gLat >= 0 ? '+' : ''}${state.gLat.toFixed(2)}G`;
    if (elGLon) elGLon.textContent = `${state.gLon >= 0 ? '+' : ''}${state.gLon.toFixed(2)}G`;
  }

  // --- RENDER 4 STM32 MODULE CARDS ---
  let totalTemp = 0;
  let hasCriticalModule = false;

  for (let i = 0; i < 4; i++) {
    const temp = state.moduleTemps[i];
    totalTemp += temp;

    const tempEl = document.getElementById(`temp-mod-${i + 1}`);
    const barEl = document.getElementById(`bar-mod-${i + 1}`);
    const statusEl = document.getElementById(`mod-status-${i + 1}`);
    const dotEl = document.getElementById(`mod-dot-${i + 1}`);
    const cardEl = document.getElementById(`card-mod-${i + 1}`);

    if (tempEl) tempEl.textContent = temp.toFixed(1);
    
    const pct = Math.min(100, Math.max(0, (temp / 100) * 100));
    if (barEl) barEl.style.width = `${pct}%`;

    if (temp > 70) {
      hasCriticalModule = true;
      if (statusEl) {
        statusEl.textContent = 'CRITICAL';
        statusEl.className = 'px-1.5 py-0.2 text-[9px] font-mono rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse font-bold';
      }
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-red-400 animate-ping';
      if (barEl) barEl.className = 'h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-300';
      if (cardEl) cardEl.className = 'p-2.5 rounded-xl bg-red-950/30 border border-red-500/60 shadow-neon-red transition-all relative overflow-hidden';
    } else if (temp > 50) {
      if (statusEl) {
        statusEl.textContent = 'WARNING';
        statusEl.className = 'px-1.5 py-0.2 text-[9px] font-mono rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold';
      }
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      if (barEl) barEl.className = 'h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300';
      if (cardEl) cardEl.className = 'p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/40 transition-all relative overflow-hidden';
    } else {
      if (statusEl) {
        statusEl.textContent = 'NORMAL';
        statusEl.className = 'px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      }
      if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      if (barEl) barEl.className = 'h-full rounded-full bg-emerald-400 transition-all duration-300';
      if (cardEl) cardEl.className = 'p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all relative overflow-hidden';
    }
  }

  const avgTemp = (totalTemp / 4).toFixed(1);
  const elAvgTempVal = document.getElementById('avg-temp-val');
  if (elAvgTempVal) elAvgTempVal.textContent = avgTemp;
}

// --- UPDATE CHART STREAM ---
function updateChartData(speedVal, powerVal) {
  const dataSpeed = energyChart.data.datasets[0].data;
  const dataPower = energyChart.data.datasets[1].data;

  dataSpeed.shift();
  dataSpeed.push(speedVal);

  dataPower.shift();
  dataPower.push(powerVal);

  energyChart.update();
}

// --- ALERT LOGGING SYSTEM ---
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
  alertItem.className = `p-2 rounded-xl border text-xs flex items-start gap-2 ${colorClass} transition-all animate-fadeIn shadow-sm`;
  alertItem.innerHTML = `
    <div class="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5 alert-icon-box">
      <i data-lucide="${iconName}" class="w-3.5 h-3.5 ${iconColor}"></i>
    </div>
    <div>
      <div class="font-bold alert-title text-[11px]">${title}</div>
      <div class="text-[10px] text-slate-400 font-mono alert-msg">${message}</div>
    </div>
    <span class="ml-auto text-[9px] text-slate-500 font-mono alert-time">${time}</span>
  `;

  elAlertsContainer.prepend(alertItem);
  lucide.createIcons();

  while (elAlertsContainer.children.length > 12) {
    elAlertsContainer.removeChild(elAlertsContainer.lastChild);
  }
}

// --- AUDIO SFX ENGINE (Web Audio API Synthesizer - Zero External Files Required) ---
class PitSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Soft Tactile UI Click (Buttons, Mode Switch, Toggles)
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // 2. F1-Style Pit Radio Bleep (Dual-Tone Transmission Beep)
  playRadioBleep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.setValueAtTime(1850, now + 0.05);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // 3. Lap Record & 0-100 Achievement Chime (3-Tone Ascending Chord)
  playLapChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.1, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.2);
      });
    } catch (e) {}
  }

  // 4. Overheat Safety Siren Alarm (Dual-Pulse Alarm)
  playWarningAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(580, now + 0.14);
      osc.frequency.linearRampToValueAtTime(880, now + 0.28);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }
}
const sfx = new PitSoundEngine();

// --- EVENT LISTENERS ---

// Auto Sim Toggle
elAutoSimBtn.addEventListener('click', () => {
  sfx.playClick();
  state.isAutoSim = !state.isAutoSim;
  if (state.isAutoSim) {
    elAutoSimLabel.textContent = 'Auto Sim';
    elAutoSimBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-400 text-black hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-neon-cyan';
    addAlert('Auto Simulation Active', 'Pit Wall telemetry simulation running', 'info');
  } else {
    elAutoSimLabel.textContent = 'Manual Mode';
    elAutoSimBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5';
    addAlert('Manual Control Engaged', 'Driver throttle slider is now in control', 'info');
  }
  lucide.createIcons();
});

// Smooth Manual Speed Slider Control
function activateManualSpeed(value) {
  if (state.isAutoSim) {
    state.isAutoSim = false;
    elAutoSimLabel.textContent = 'Manual Mode';
    elAutoSimBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-1.5';
    addAlert('Manual Control Active', 'Throttle slider in driver control', 'info');
    lucide.createIcons();
  }
  state.targetSpeed = parseFloat(value);
  elSliderSpeedVal.textContent = `${Math.round(state.targetSpeed)} km/h`;
}

elSpeedSlider.addEventListener('input', (e) => activateManualSpeed(e.target.value));
elSpeedSlider.addEventListener('mousedown', (e) => { sfx.playClick(); activateManualSpeed(e.target.value); });
elSpeedSlider.addEventListener('touchstart', (e) => { activateManualSpeed(e.target.value); }, { passive: true });

// Battery Slider
elBatterySlider.addEventListener('input', (e) => {
  state.batteryPct = parseFloat(e.target.value);
  elSliderBatteryVal.textContent = `${Math.round(state.batteryPct)}%`;
  
  if (state.batteryPct < 20) {
    addAlert('Low Battery Warning', `Battery State of Charge critically low (${Math.round(state.batteryPct)}%) - Plan pit stop`, 'warning');
    sfx.playWarningAlarm();
  }
});

// Drive Mode Buttons
document.querySelectorAll('.drive-mode-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    sfx.playClick();
    const mode = e.currentTarget.getAttribute('data-mode');
    state.driveMode = mode;
    elHeaderDriveMode.textContent = mode;

    document.querySelectorAll('.drive-mode-btn').forEach(b => {
      b.className = 'drive-mode-btn py-1 text-[11px] font-semibold rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all';
    });

    e.currentTarget.className = 'drive-mode-btn py-1 text-[11px] font-bold rounded-lg bg-emerald-400 text-black border border-emerald-300 shadow-neon-cyan transition-all';

    if (elAccelStat) {
      if (mode === 'SPORT') elAccelStat.textContent = '3.20s';
      else if (mode === 'NORMAL') elAccelStat.textContent = '4.20s';
      else if (mode === 'ECO') elAccelStat.textContent = '5.60s';
    }

    addAlert(`Drive Mode: ${mode}`, `Throttle map tuned (${mode === 'SPORT' ? '0-100: 3.20s' : mode === 'NORMAL' ? '0-100: 4.20s' : '0-100: 5.60s'})`, 'info');
  });
});

// Click Peak Speed to Reset
if (elMaxSpeed) {
  elMaxSpeed.parentElement.addEventListener('click', () => {
    sfx.playClick();
    state.maxSpeed = Math.round(state.speed);
    elMaxSpeed.textContent = `${state.maxSpeed} km/h`;
    addAlert('Peak Speed Reset', `Top speed benchmark reset to ${state.maxSpeed} km/h`, 'info');
  });
}

// Trigger Overheat Safety Simulation
elTriggerAlertBtn.addEventListener('click', () => {
  state.overheatTriggered = !state.overheatTriggered;
  if (state.overheatTriggered) {
    sfx.playWarningAlarm();
    addAlert('CRITICAL OVERHEAT WARNING', 'Inverter Core (STM32G4) & Motor exceeded 85°C thermal limit!', 'danger');
    elTriggerAlertBtn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white animate-pulse transition-all flex items-center gap-1 shadow-neon-red';
  } else {
    sfx.playClick();
    addAlert('Thermal Levels Nominal', 'Cooling loops restored nominal operating temperature', 'info');
    elTriggerAlertBtn.className = 'px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-1';
  }
});

// Clear Alerts
elClearAlertsBtn.addEventListener('click', () => {
  sfx.playClick();
  elAlertsContainer.innerHTML = '';
  addAlert('Logs Cleared', 'System event stream reset', 'info');
});

// --- SFX AUDIO TOGGLE (MUTE / UNMUTE) ---
const elSfxBtn = document.getElementById('sfx-toggle-btn');
const elSfxBtnMobile = document.getElementById('sfx-toggle-btn-mobile');
const elSfxLabel = document.getElementById('sfx-label');
const elSfxIcon = document.getElementById('sfx-icon');

function toggleSfx() {
  sfx.enabled = !sfx.enabled;
  if (sfx.enabled) {
    sfx.playClick();
    if (elSfxLabel) elSfxLabel.textContent = 'SFX: ON';
    if (elSfxIcon) elSfxIcon.setAttribute('data-lucide', 'volume-2');
    if (elSfxBtn) elSfxBtn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400/50 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer shadow-sm';
    addAlert('Pit Audio SFX Enabled', 'Radio bleeps and telemetry sound cues active', 'info');
  } else {
    if (elSfxLabel) elSfxLabel.textContent = 'SFX: MUTE';
    if (elSfxIcon) elSfxIcon.setAttribute('data-lucide', 'volume-x');
    if (elSfxBtn) elSfxBtn.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-500 hover:text-slate-400 transition-all cursor-pointer shadow-sm';
    addAlert('Pit Audio Muted', 'Sound cues silenced', 'info');
  }
  lucide.createIcons();
}

if (elSfxBtn) elSfxBtn.addEventListener('click', toggleSfx);
if (elSfxBtnMobile) elSfxBtnMobile.addEventListener('click', toggleSfx);

// --- FULLSCREEN PIT MONITOR API ---
const elFullscreenBtn = document.getElementById('fullscreen-btn');
const elFullscreenBtnMobile = document.getElementById('fullscreen-btn-mobile');
const elFullscreenLabel = document.getElementById('fullscreen-label');
const elFullscreenIcon = document.getElementById('fullscreen-icon');

function toggleFullscreen() {
  sfx.playClick();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

document.addEventListener('fullscreenchange', () => {
  const isFull = !!document.fullscreenElement;
  if (isFull) {
    if (elFullscreenLabel) elFullscreenLabel.textContent = 'Exit Screen';
    if (elFullscreenIcon) elFullscreenIcon.setAttribute('data-lucide', 'minimize');
    addAlert('Fullscreen Mode Active', 'Display optimized for Pit Wall tent TV monitor', 'info');
  } else {
    if (elFullscreenLabel) elFullscreenLabel.textContent = 'Fullscreen';
    if (elFullscreenIcon) elFullscreenIcon.setAttribute('data-lucide', 'maximize');
  }
  lucide.createIcons();
});

if (elFullscreenBtn) elFullscreenBtn.addEventListener('click', toggleFullscreen);
if (elFullscreenBtnMobile) elFullscreenBtnMobile.addEventListener('click', toggleFullscreen);

// --- THEME TOGGLE (DARK MODE / LIGHT MODE) ---
const elThemeBtn = document.getElementById('theme-toggle-btn');
const elThemeBtnMobile = document.getElementById('theme-toggle-btn-mobile');
const elThemeLabel = document.getElementById('theme-label');
const elThemeIcon = document.getElementById('theme-icon');
let isDarkMode = true;

function toggleTheme() {
  sfx.playClick();
  isDarkMode = !isDarkMode;
  if (!isDarkMode) {
    // Switch to Light Theme
    document.body.classList.add('light-theme');
    if (elThemeLabel) elThemeLabel.textContent = 'Dark Mode';
    if (elThemeIcon) elThemeIcon.setAttribute('data-lucide', 'moon');
    
    // Recolor Chart.js for Light Mode
    energyChart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.05)';
    energyChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.05)';
    energyChart.options.scales.y.ticks.color = '#475569';
    energyChart.options.plugins.legend.labels.color = '#1e293b';
  } else {
    // Switch back to Dark Theme
    document.body.classList.remove('light-theme');
    if (elThemeLabel) elThemeLabel.textContent = 'Light Mode';
    if (elThemeIcon) elThemeIcon.setAttribute('data-lucide', 'sun');

    // Recolor Chart.js for Dark Mode
    energyChart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.04)';
    energyChart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.05)';
    energyChart.options.scales.y.ticks.color = '#64748b';
    energyChart.options.plugins.legend.labels.color = '#94a3b8';
  }
  energyChart.update();
  lucide.createIcons();
  addAlert('Theme Changed', `Switched to ${isDarkMode ? 'Dark Racing' : 'Light Pro'} Mode`, 'info');
}

if (elThemeBtn) elThemeBtn.addEventListener('click', toggleTheme);
if (elThemeBtnMobile) elThemeBtnMobile.addEventListener('click', toggleTheme);

// --- CAN-BUS REAL-TIME PACKET INSPECTOR CONTROLLER ---
const elCanModal = document.getElementById('can-modal');
const elOpenCanModalBtn = document.getElementById('open-can-modal-btn');
const elCloseCanModalBtn = document.getElementById('close-can-modal-btn');
const elCanStreamBody = document.getElementById('can-stream-body');
const elCanPacketCount = document.getElementById('can-packet-count');
const elCanBusLoad = document.getElementById('can-bus-load');
const elCanExportBtn = document.getElementById('can-export-btn');

let canFilter = 'all';
let canTotalPackets = 1842;

function toHexByte(val) {
  const v = Math.max(0, Math.min(255, Math.floor(Math.abs(val))));
  return '0x' + v.toString(16).toUpperCase().padStart(2, '0');
}

function openCanModal(filterId = 'all') {
  sfx.playClick();
  canFilter = filterId;
  updateCanFilterTabsUI();
  renderCanPackets();
  if (elCanModal) {
    elCanModal.classList.remove('hidden');
  }
}

function closeCanModal() {
  sfx.playClick();
  if (elCanModal) {
    elCanModal.classList.add('hidden');
  }
}

function updateCanFilterTabsUI() {
  document.querySelectorAll('.can-tab-btn').forEach(btn => {
    const target = btn.getAttribute('data-target');
    if (target === canFilter) {
      btn.className = 'can-tab-btn px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-black shadow-neon-cyan transition-all cursor-pointer';
    } else {
      btn.className = 'can-tab-btn px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer';
    }
  });
}

function renderCanPackets() {
  if (!elCanStreamBody) return;

  canTotalPackets += 4;
  if (elCanPacketCount) elCanPacketCount.textContent = canTotalPackets.toLocaleString();
  if (elCanBusLoad) {
    const load = (28.5 + (state.speed * 0.08) + (Math.random() * 2 - 1)).toFixed(1);
    elCanBusLoad.textContent = `${load}%`;
  }

  // Node 1: BMU Master (0x101)
  const vInt = Math.round(state.batteryVoltage * 10);
  const cInt = Math.round(Math.abs(state.packCurrent) * 10);
  const deltaInt = Math.round(parseFloat(state.cellDeltaV) * 1000);
  const bmuBytes = [
    toHexByte((vInt >> 8) & 0xFF), toHexByte(vInt & 0xFF),
    toHexByte((cInt >> 8) & 0xFF), toHexByte(cInt & 0xFF),
    toHexByte(deltaInt & 0xFF), toHexByte(state.moduleTemps[0]),
    0x63, toHexByte((state.simTime * 10) & 0xFF)
  ];

  // Node 2: Inverter (0x102)
  const rpmBytes = [
    toHexByte((state.rpm >> 8) & 0xFF), toHexByte(state.rpm & 0xFF),
    toHexByte((state.motorTorque >> 8) & 0xFF), toHexByte(state.motorTorque & 0xFF),
    toHexByte(state.moduleTemps[1]), toHexByte(state.motorTemp),
    toHexByte((state.speed / 180) * 100), 0x00
  ];

  // Node 3: VCU Master (0x103)
  const modeCode = state.driveMode === 'SPORT' ? 0x02 : (state.driveMode === 'NORMAL' ? 0x01 : 0x00);
  const vcuBytes = [
    toHexByte(modeCode), toHexByte((state.speed / 180) * 100),
    0x00, 0x03, toHexByte(state.moduleTemps[2]),
    0x01, 0xAA, toHexByte((state.simTime * 15) & 0xFF)
  ];

  // Node 4: Gateway (0x104)
  const gateBytes = [
    0xC3, 0x0C, toHexByte(state.currentLap),
    toHexByte(state.lapTimeSec & 0xFF), toHexByte(state.moduleTemps[3]),
    0x00, 0x14, toHexByte((state.simTime * 8) & 0xFF)
  ];

  const nodes = [
    {
      id: '0x101',
      name: 'BMU Master (BMS & Cell Balancer)',
      mcu: 'STM32F405RG • 168 MHz Cortex-M4',
      bytes: bmuBytes,
      decoded: `Pack Voltage: ${state.batteryVoltage}V | Current: ${state.packCurrent.toFixed(1)}A | DeltaV: ${state.cellDeltaV}V | Temp: ${state.moduleTemps[0].toFixed(1)}°C | SOH: 99.4%`,
      rate: '100 Hz (10ms Periodic TX)'
    },
    {
      id: '0x102',
      name: 'Inverter Core (SiC Dual MOSFET Driver)',
      mcu: 'STM32G474RE • 170 MHz Cortex-M4 + FMAC/CORDIC',
      bytes: rpmBytes,
      decoded: `Motor RPM: ${state.rpm.toLocaleString()} | Torque: ${state.motorTorque} Nm | Inverter T: ${state.moduleTemps[1].toFixed(1)}°C | Motor T: ${state.motorTemp.toFixed(1)}°C | PWM Duty: ${Math.round((state.speed / 180) * 100)}%`,
      rate: '250 Hz (4ms High-Speed FOC Loop)'
    },
    {
      id: '0x103',
      name: 'Vehicle Control Unit (Master VCU)',
      mcu: 'STM32H743ZI • 480 MHz Cortex-M7 Dual-Core',
      bytes: vcuBytes,
      decoded: `Drive Mode: ${state.driveMode} | Throttle Map: ${Math.round((state.speed / 180) * 100)}% | Gear: D | VCU T: ${state.moduleTemps[2].toFixed(1)}°C | HVIL Safety: CLOSED (1)`,
      rate: '100 Hz (10ms Supervisory Control)'
    },
    {
      id: '0x104',
      name: 'Telemetry Pit Gateway (RF 433MHz / Wi-Fi)',
      mcu: 'STM32F103C8 • 72 MHz Cortex-M3',
      bytes: gateBytes,
      decoded: `RSSI: -61 dBm | Latency: 12ms | Lap: ${state.currentLap}/${state.totalLaps} | Gate T: ${state.moduleTemps[3].toFixed(1)}°C | Packet Dropped: 0`,
      rate: '50 Hz (20ms Pit Telemetry Broadcast)'
    }
  ];

  const filteredNodes = canFilter === 'all' ? nodes : nodes.filter(n => n.id === canFilter);

  elCanStreamBody.innerHTML = filteredNodes.map(node => `
    <div class="can-packet-card p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-emerald-500/50 transition-all">
      <div class="flex items-center justify-between flex-wrap gap-1">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-xs">${node.id}</span>
          <span class="font-bold text-white text-xs">${node.name}</span>
        </div>
        <span class="text-[10px] text-slate-400 font-mono">${node.mcu}</span>
      </div>

      <!-- Raw Hex Bytes Row -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-[10px] text-slate-400 font-semibold mr-1">DATA [DLC 8]:</span>
        ${node.bytes.map((b, idx) => `
          <span class="can-hex-box px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs shadow-sm">
            ${b}
          </span>
        `).join('')}
      </div>

      <!-- Decoded Physical Values -->
      <div class="can-decoded-box p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between flex-wrap gap-1">
        <div class="truncate">
          <strong class="text-emerald-400 font-bold">Decoded:</strong> <span class="can-decoded-text">${node.decoded}</span>
        </div>
        <span class="text-[9px] font-mono text-slate-500 shrink-0">${node.rate}</span>
      </div>
    </div>
  `).join('');
}

// Export CAN Log CSV
function exportCanLogCsv() {
  sfx.playClick();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Timestamp,CAN_ID,DLC,Byte0,Byte1,Byte2,Byte3,Byte4,Byte5,Byte6,Byte7,Speed_kmh,Pack_Voltage_V,Pack_Current_A,Motor_RPM,Inverter_Temp_C\n';
  
  for (let i = 0; i < 25; i++) {
    const timeOffset = (i * 0.1).toFixed(2);
    csvContent += `${timeOffset},0x101,8,0x18,0x54,0x01,0xA9,0x22,0x88,0x0F,0x4B,${Math.round(state.speed)},${state.batteryVoltage},${state.packCurrent.toFixed(1)},${state.rpm},${state.moduleTemps[1].toFixed(1)}\n`;
    csvContent += `${timeOffset},0x102,8,0x27,0x10,0x00,0x55,0x26,0x01,0x61,0x04,${Math.round(state.speed)},${state.batteryVoltage},${state.packCurrent.toFixed(1)},${state.rpm},${state.moduleTemps[1].toFixed(1)}\n`;
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ecomile_can_telemetry_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  addAlert('CAN Log Exported', 'Telemetry dataset downloaded (.CSV)', 'success');
}

// Open / Close Event Listeners
if (elOpenCanModalBtn) elOpenCanModalBtn.addEventListener('click', () => openCanModal('all'));
if (elCloseCanModalBtn) elCloseCanModalBtn.addEventListener('click', closeCanModal);
if (elCanExportBtn) elCanExportBtn.addEventListener('click', exportCanLogCsv);

// Close on clicking backdrop
if (elCanModal) {
  elCanModal.addEventListener('click', (e) => {
    if (e.target === elCanModal) closeCanModal();
  });
}

// Clicking Filter Tabs
document.querySelectorAll('.can-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    sfx.playClick();
    canFilter = e.currentTarget.getAttribute('data-target');
    updateCanFilterTabsUI();
    renderCanPackets();
  });
});

// Clicking STM32 Cards opens modal filtered to that module
const modCard1 = document.getElementById('card-mod-1');
const modCard2 = document.getElementById('card-mod-2');
const modCard3 = document.getElementById('card-mod-3');
const modCard4 = document.getElementById('card-mod-4');

if (modCard1) { modCard1.classList.add('cursor-pointer'); modCard1.addEventListener('click', () => openCanModal('0x101')); }
if (modCard2) { modCard2.classList.add('cursor-pointer'); modCard2.addEventListener('click', () => openCanModal('0x102')); }
if (modCard3) { modCard3.classList.add('cursor-pointer'); modCard3.addEventListener('click', () => openCanModal('0x103')); }
if (modCard4) { modCard4.classList.add('cursor-pointer'); modCard4.addEventListener('click', () => openCanModal('0x104')); }

// Periodically update modal if open
setInterval(() => {
  if (elCanModal && !elCanModal.classList.contains('hidden')) {
    renderCanPackets();
  }
}, 300);

// --- OFFICIAL RACE SUMMARY REPORT CONTROLLER ---
const elReportBtn = document.getElementById('report-btn');
const elReportBtnMobile = document.getElementById('report-btn-mobile');
const elReportModal = document.getElementById('report-modal');
const elCloseReportModalBtn = document.getElementById('close-report-modal-btn');
const elPrintReportBtn = document.getElementById('print-report-btn');
const elRepDownloadJsonBtn = document.getElementById('rep-download-json-btn');

function openReportModal() {
  sfx.playClick();
  
  // Populate Live Metrics into Report
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
  
  const elRepMode = document.getElementById('rep-mode');
  const elRepTimestamp = document.getElementById('rep-timestamp');
  const elRepBestLap = document.getElementById('rep-best-lap');
  const elRepSprint = document.getElementById('rep-sprint');
  const elRepPeakSpeed = document.getElementById('rep-peak-speed');
  const elRepLaps = document.getElementById('rep-laps');
  const elRepTotalEnergy = document.getElementById('rep-total-energy');
  const elRepRegenEnergy = document.getElementById('rep-regen-energy');
  const elRepSoc = document.getElementById('rep-soc');
  const elRepDelta = document.getElementById('rep-delta');
  const elRepTBmu = document.getElementById('rep-t-bmu');
  const elRepTInv = document.getElementById('rep-t-inv');
  const elRepTVcu = document.getElementById('rep-t-vcu');
  const elRepTGate = document.getElementById('rep-t-gate');

  if (elRepMode) elRepMode.textContent = state.driveMode;
  if (elRepTimestamp) elRepTimestamp.textContent = dateStr;
  if (elRepBestLap) elRepBestLap.textContent = formatLapTime(state.bestLapSec);
  if (elRepSprint) elRepSprint.textContent = `${state.accelLastRecorded}s`;
  if (elRepPeakSpeed) elRepPeakSpeed.textContent = `${state.maxSpeed} km/h`;
  if (elRepLaps) elRepLaps.textContent = `${state.currentLap} / ${state.totalLaps}`;
  if (elRepTotalEnergy) elRepTotalEnergy.textContent = `${state.totalKwh.toFixed(2)} kWh`;
  
  const regenPct = ((state.regenKwh / (state.totalKwh || 1)) * 100).toFixed(1);
  if (elRepRegenEnergy) elRepRegenEnergy.textContent = `+${state.regenKwh.toFixed(2)} kWh (${regenPct}%)`;
  
  if (elRepSoc) elRepSoc.textContent = `${Math.round(state.batteryPct)}% (${state.batteryVoltage.toFixed(1)}V)`;
  if (elRepDelta) elRepDelta.textContent = `${state.cellDeltaV} V (BALANCED)`;
  
  if (elRepTBmu) elRepTBmu.textContent = `${state.moduleTemps[0].toFixed(1)}°C`;
  if (elRepTInv) elRepTInv.textContent = `${state.moduleTemps[1].toFixed(1)}°C`;
  if (elRepTVcu) elRepTVcu.textContent = `${state.moduleTemps[2].toFixed(1)}°C`;
  if (elRepTGate) elRepTGate.textContent = `${state.moduleTemps[3].toFixed(1)}°C`;

  if (elReportModal) {
    elReportModal.classList.remove('hidden');
  }
}

function closeReportModal() {
  sfx.playClick();
  if (elReportModal) {
    elReportModal.classList.add('hidden');
  }
}

if (elReportBtn) elReportBtn.addEventListener('click', openReportModal);
if (elReportBtnMobile) elReportBtnMobile.addEventListener('click', openReportModal);
if (elCloseReportModalBtn) elCloseReportModalBtn.addEventListener('click', closeReportModal);

if (elReportModal) {
  elReportModal.addEventListener('click', (e) => {
    if (e.target === elReportModal) closeReportModal();
  });
}

if (elPrintReportBtn) {
  elPrintReportBtn.addEventListener('click', () => {
    sfx.playClick();
    window.print();
  });
}

if (elRepDownloadJsonBtn) {
  elRepDownloadJsonBtn.addEventListener('click', () => {
    sfx.playClick();
    const reportData = {
      event: 'ECOMILE EV Innovation Grand Prix',
      vehicleId: 'ECOMILE-EV01',
      timestamp: new Date().toISOString(),
      driveMode: state.driveMode,
      bestLap: formatLapTime(state.bestLapSec),
      sprint0to100: `${state.accelLastRecorded}s`,
      peakSpeedKmh: state.maxSpeed,
      totalEnergyKwh: state.totalKwh.toFixed(2),
      regenEnergyKwh: state.regenKwh.toFixed(2),
      batterySocPct: Math.round(state.batteryPct),
      cellDeltaV: state.cellDeltaV,
      stm32ThermalMatrix: {
        bmuMasterF4: `${state.moduleTemps[0].toFixed(1)}C`,
        inverterCoreG4: `${state.moduleTemps[1].toFixed(1)}C`,
        masterVcuH7: `${state.moduleTemps[2].toFixed(1)}C`,
        telemetryGateF1: `${state.moduleTemps[3].toFixed(1)}C`
      },
      scrutineeringVerdict: 'PASSED TECHNICAL ENVELOPE'
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ecomile_race_summary_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addAlert('JSON Report Saved', 'Full session dataset exported (.JSON)', 'success');
  });
}

// --- DYNAMIC PIT RADIO BROADCAST ROTATION ---
const pitRadioMessages = [
  'PACE OPTIMAL • LIFT & COAST TURN 4',
  'DELTA +0.35s • PUSH HARVEST IN SECTOR 2',
  'ENERGY ON BUDGET • GAP TO P2 +4.2s',
  'BATTERY CELL BALANCED • MAXIMUM POWER AVAILABLE',
  'BOX THIS LAP FOR TIRE TEMP CHECK'
];
let radioMsgIndex = 0;

setInterval(() => {
  radioMsgIndex = (radioMsgIndex + 1) % pitRadioMessages.length;
  if (elPitRadioMsg) {
    elPitRadioMsg.textContent = pitRadioMessages[radioMsgIndex];
    sfx.playRadioBleep();
  }
}, 18000);

// --- START TELEMETRY CLOCK LOOP ---
setInterval(runSimulationCycle, 150);