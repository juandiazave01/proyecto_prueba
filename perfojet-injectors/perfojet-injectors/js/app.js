const docs = [
  {
    title:'Process Overview — Perfojet Area (Line 5)', block:'WE_Sys HMI', network:'Process context', status:'completed',
    images:[{src:'assets/images/perfojet-we-sys-layout.png',caption:'WE_Sys HMI screen — hydroentangling roll layout with injector groups'}],
    description:'FC126 (HPGV_Inj) is not a single-injector block — it is called once per physical injector pair on Line 5\'s Perfojet (hydroentangling) area. The process flows Vac. Roll → Pre Wet → J1 → C1 → C2 → C3 → J2, and each calender roll (C1/C2/C3) is fed high-pressure water by its own pair of injectors.',
    details:{
      'C1 roll':'InjPT (currently OFF) + Inj11 + Inj12',
      'C2 roll':'Inj21 + Inj22',
      'C3 roll':'Inj31 + Inj32',
      'InjPP':'Common HP pump feeding all injector groups',
      'HPGV Mode':'"Plain" — shown on WE_Sys HMI, matches the FC122 EM_HPGV caller name'
    },
    steps:[
      {title:'1. Shared pump',text:'InjPP (HP Pump Pressure) feeds all three roll groups from one common high-pressure source.'},
      {title:'2. Per-roll injector pair',text:'Each calender roll has two injectors, each running its own instance of FC126.'},
      {title:'3. Door/light-curtain interlock',text:'"Doors Closed" and "Light Curtain Fault Disable" on the HMI tie directly into the FrontDoorsOpened interlock used in Network 2.'}
    ],
    code:'',
    notes:'InjPT was OFF at the time of this documentation — confirm current status before using it as a live reference point.'
  },
  {
    title:'Block Interface — FC126 "HPGV_Inj"', block:'FC126, called from FC122 EM_HPGV', network:'Block interface', status:'completed',
    images:[
      {src:'assets/images/fc126-block-interface.png',caption:'Full Input / Output / InOut / Temp interface of FC126'},
      {src:'assets/images/fc126-interface-spare-bools.png',caption:'SpareBool1 and SpareBool2 declared as Temp bits'}
    ],
    description:'One instance of this block runs per physical injector, called from FC122 (EM_HPGV). Path: PLC_North → MES → HP GV → EM → HPGV_Inj [FC126].',
    details:{
      Input:'OperCondition, ResetFaults, Injector_Locked, ThreadingOK, StopPID_Fault, HP_Running, HP_RunningForPID, MaxSP, ActFlow, Max_Pressure, DataReadMES',
      Output:'PressMismatchAL, ClogAL, CalcActFlowDifAL, SPMismatchAL',
      InOut:'PumpOutPressure ("Trans"), InjInPressure ("Trans"), Pressure_PID ("PID_Params"), Inj_Name ("Inj_Unit")',
      Temp:'PressHighLimit/LowLimit, ActFlowPerHour, TotalEnergyPerHour, Pump_InjPressDelta, Act_CalcFlowDelta, SPPressDelta, ActualLineSpeed, 30_Sec_Delta_Avg, 7_Min_Timer_Mismatch, 7_min_Timer_Clog, Clog_Pulse, Avg_Pulse'
    },
    steps:[],
    code:'',
    notes:'"7_Min_Timer_Mismatch" is misnamed — confirmed in use as the 5-minute mismatch deviation timer, not 7 minutes. Do not rename the tag; just remember the real value when tuning.'
  },
  {
    title:'Pressure Setpoint Limiting & PID Activation', block:'FC126', network:'Networks 1–4', status:'completed',
    images:[
      {src:'assets/images/n1-n2-n3-pressure-limits.png',caption:'N1 HMI Pressure SP Limitation, N2 Pressure Low SP Limitation, N3 Injector PID Activation'},
      {src:'assets/images/n4-force-reset-sp.png',caption:'N4 Force Reset of PID SP on Fault'}
    ],
    description:'Clamps the operator setpoint into a safe range, gates PID auto-activation behind several interlocks, and force-resets the setpoint to 0 on any active fault.',
    details:{
      'N1 High clamp':'OperSP > MaxSP → MOVE MaxSP into OperSP',
      'N2 Low clamp':'OperSP > LowSP(700) → MOVE 700; drops to 500/600 when front doors are open',
      'N3 PID gate':'Injector_Locked, HP_RunningForPID, OperSP > 0, ThreadingOK, and NOT front-doors-open must all be satisfied',
      'N4 Fault reset':'StopPID_Fault OR InjInPressure.Fault OR Clog_MFA OR InjectorUnlocked_MFA → MOVE 0 into OperSP'
    },
    steps:[
      {title:'1. Clamp high',text:'N1 prevents the operator setpoint from exceeding MaxSP.'},
      {title:'2. Clamp low',text:'N2 enforces a 700 minimum (or 500–600 when the front doors are open, per ECR interlock).'},
      {title:'3. Gate auto mode',text:'N3 only allows the PID into automatic when the injector is unlocked, HP is running for PID, threading is OK, doors are closed, and the setpoint is above 0.'},
      {title:'4. Force safe on fault',text:'N4 zeroes the setpoint immediately if any of four fault conditions are active, regardless of what the operator has set.'}
    ],
    code:'',
    notes:'The front-door interlock changes the effective low limit — do not assume 700 is the floor in every door state.'
  },
  {
    title:'Flow Calculation & Orifice Wear Estimation', block:'FC126', network:'Networks 5, 6, 7, 8, 9, 10', status:'completed',
    images:[
      {src:'assets/images/n5-theoretical-flow.png',caption:'N5 — Theoretical flow calculation (CALCULATE, SQRT of pressure/area/coefficient)'},
      {src:'assets/images/n6-orifice-coefficient.png',caption:'N6 — Actual orifice coefficient calculation from real measured flow'},
      {src:'assets/images/n7-n8-sampling-window.png',caption:'N7 sampling pressure window, N8 sample-and-hold of Orifice CoefAct / ActFlow'},
      {src:'assets/images/n9-n10-totalizers.png',caption:'N9 total flow (m³) accumulator, N10 total energy accumulator'}
    ],
    description:'The core diagnostic idea of this block: calculate what flow *should* be through the injector orifice given current pressure and geometry, compare it against the *actual* measured flow, and back-calculate a live orifice coefficient. A drifting coefficient is an early sign of orifice wear or partial blockage — before it becomes a hard clog fault.',
    details:{
      'N5 formula':'OUT := SQRT(IN1*IN2*IN3)*... using scaled injector pressure, area, orifice coefficient → Inj_Name.Calc.Flow',
      'N6 formula':'OUT := IN1*IN8/(IN5*IN6*...) using ActFlow and scaled pressure → Inj_Name.Orifice.CoefAct',
      'N7 window':'PressLowLimit = ProdSP−10, PressHighLimit = ProdSP+10 — defines when a sample is "valid"',
      'N8 sample-hold':'Only when SP_Auto>0 and pressure is IN_RANGE do CoefAct/ActFlow get copied into ...CoefLast / ...ActFlowLast',
      'N9/N10':'Accumulate total m³ and total energy while running, both reset by the MES DataReadMES trigger (N11)'
    },
    steps:[
      {title:'1. Predict',text:'N5 computes the theoretical flow the physics of the orifice should produce at the current pressure.'},
      {title:'2. Measure',text:'ActFlow (an input, summed from the feeding pumps) is the real measured flow.'},
      {title:'3. Back-solve',text:'N6 inverts the flow formula using the real ActFlow to solve for what the orifice coefficient must actually be right now.'},
      {title:'4. Only trust valid samples',text:'N7/N8 restrict this comparison to moments when pressure is close to setpoint, avoiding noisy readings during transients.'},
      {title:'5. Accumulate for MES',text:'N9/N10 total up flow and energy for reporting, and N11 zeroes them out whenever MES confirms it read the data.'}
    ],
    code:'',
    notes:'CoefAct/ActFlow are only meaningful right after a valid in-range sample — always read the "Last" values (CoefLast, ActFlowLast) for trending, not the raw live tags.'
  },
  {
    title:'Process Deltas — Pressure & Flow Comparisons', block:'FC126', network:'Networks 13, 14, 15', status:'completed',
    images:[{src:'assets/images/n13-delta-bool15-bypass.png',caption:'N13 — Pump/Injector pressure delta, with SpareBool15 selecting real calc vs. bypass'},
      {src:'assets/images/n14-n15-deltas.png',caption:'N14 flow delta (calculated vs actual, absolute), N15 pressure delta (setpoint vs actual)'}],
    description:'Three delta values feed the fault-detection logic in N16–N23: pump-vs-injector pressure, calculated-vs-actual flow, and setpoint-vs-actual pressure.',
    details:{
      'N13 normal':'SpareBool15 = FALSE (default) → Pump_InjPress.Delta = PumpOutPressure − InjInPressure',
      'N13 bypass':'SpareBool15 = TRUE → forces Pump_InjPress.Delta = 0 (PumpOutPressure − itself), bypassing this alarm source',
      'N14':'Act_CalcFlow.Delta = ABS(Inj_Name.Calc.Flow − ActFlow)',
      'N15':'SPPressDelta = Pressure_PID.SP_Auto − InjInPressure.ScaledValue'
    },
    steps:[],
    code:'',
    notes:'SpareBool15 is a manual/maintenance bypass — if it\'s TRUE in the field, the pump/injector pressure mismatch alarm is effectively disabled. Check its state before trusting a "no mismatch" reading.'
  },
  {
    title:'Fault Detection — Mismatch, Clog & Unlock Alarms', block:'FC126', network:'Networks 16–23', status:'completed',
    images:[
      {src:'assets/images/n16-n17-linespeed-mismatch.png',caption:'N16 line-speed = product-speed check, N17 mismatch/clog alarm shaping (currently OFF)'},
      {src:'assets/images/n18-mismatch-alarm-30savg.png',caption:'N18 — Pressure and SP mismatch alarms with 30-second averaging'},
      {src:'assets/images/n21-clog-mfa.png',caption:'N21 — Clog minor fault, delayed timer on Pump_InjPress.Delta'},
      {src:'assets/images/n23-injector-unlocked-mfa.png',caption:'N23 — Injector Unlocked minor fault'}
    ],
    description:'Three independent fault paths, all gated by SpareBool5 (line-speed-matches-product-speed interlock, set in N16), so alarms don\'t fire during speed transitions.',
    details:{
      'N16 interlock':'SpareBool5 set TRUE when ActualLineSpeed == ProdSpeed; used to gate N17/N18/N19',
      'N17 status':'Mismatch/Clog alarm shaping — currently OFF, kept for reference (ECR 25-004)',
      'N18 PressMismatchAL':'SET when pressure/SP delta stays outside range for 30-second rolling average (IN_RANGE/OUT_RANGE blocks)',
      'N18 SPMismatchAL':'SET/RESET based on SPPressDelta thresholds (-50 to 50)',
      'N19':'RESET both mismatch alarms when HP_Running drops or SpareBool5 goes false',
      'N20 CalcActFlowDifAL':'Fires when Act_CalcFlow.Delta exceeds Inj_Name.Calc.ActFlowDifSP (default 20)',
      'N21 ClogMFA':'SET when Pump_InjPress.Delta stays > 200 for the clog delay timer (400 = 40s)',
      'N23 InjectorUnlockedMFA':'SET when SP_Auto > 0, Injector_Locked is FALSE, and HP_Running is TRUE'
    },
    steps:[
      {title:'1. Gate on line speed',text:'N16 only allows mismatch evaluation once actual line speed matches product speed — avoids false alarms during ramp-up/down.'},
      {title:'2. Pressure/SP mismatch',text:'N18 uses a 30-second average to filter noise before setting PressMismatchAL or SPMismatchAL.'},
      {title:'3. Flow deviation alarm',text:'N20 catches when the calculated-vs-actual flow gap grows past 20, an early orifice-wear signal separate from the hard clog fault.'},
      {title:'4. Clog fault',text:'N21 requires the pressure delta to stay above 200 continuously for 40 seconds before latching ClogMFA — a sustained condition, not a spike.'},
      {title:'5. Unlock fault',text:'N23 catches an injector that loses its mechanical lock while the system is actively running.'}
    ],
    code:'',
    notes:'N17 is documented but disabled (OFF) — don\'t assume it\'s active in the running program. The live mismatch logic is entirely N18/N19/N20.'
  },
  {
    title:'Reset & Threshold Initialization', block:'FC126', network:'Networks 22, 24', status:'completed',
    images:[
      {src:'assets/images/n22-bool10-threshold-init.png',caption:'N22 — SpareBool10 triggers a MOVE chain restoring default alarm thresholds'},
      {src:'assets/images/n24-reset-faults.png',caption:'N24 — Reset Faults clears ClogMFA and InjectorUnlockedMFA'}
    ],
    description:'Two levels of reset: a normal fault reset (N24) for operators, and a threshold re-initialization (N22, via SpareBool10) for maintenance when someone has manually changed the alarm limit spares.',
    details:{
      'N22 trigger':'SpareBool10 = TRUE',
      'N22 restores':'Int10=2500, Int11=-2500, Int12=2500, Int13=2500, Int14=0, Int15=0, Int17=445, Int18=2500',
      'N24 trigger':'#ResetFaults input',
      'N24 clears':'Inj_Name.ClogMFA, Inj_Name.InjectorUnlockedMFA'
    },
    steps:[
      {title:'1. Operator reset',text:'N24 — the normal ResetFaults input clears the two latched minor faults.'},
      {title:'2. Threshold reset',text:'N22 — SpareBool10 rewrites every alarm-threshold spare back to its documented default, undoing any manual field tweaks.'}
    ],
    code:'',
    notes:'SpareBool10 is a maintenance-only action — pulsing it wipes out any manually tuned thresholds without warning. Confirm before triggering it in a live system.'
  },
  {
    title:'SpareBool Reference — Confirmed Roles', block:'FC126', network:'Cross-reference', status:'completed',
    images:[],
    description:'The four SpareBool bits in this block are not spares in the unused sense — each has a confirmed functional role, reverse-engineered network by network.',
    details:{
      'SpareBool1':'Static memory bit for the first P_TRIG instance in N18 (edge-detect helper, default TRUE)',
      'SpareBool2':'Static memory bit for the second P_TRIG instance in N17/N18 (edge-detect helper, default FALSE)',
      'SpareBool5':'Line-speed-matches-product-speed flag, set in N16, gates mismatch evaluation in N17/N18/N19',
      'SpareBool10':'Manual trigger — pulses a MOVE chain that restores all alarm-threshold spares to default (N22)',
      'SpareBool15':'Bypass selector in N13 — FALSE (default) runs the real Pump/Injector pressure delta calc; TRUE forces the delta to 0, disabling that alarm source'
    },
    steps:[],
    code:'',
    notes:'SpareBool10 and SpareBool15 both have real operational consequences if toggled — they are not inert despite the "Spare" naming. Treat them as configuration bits, not free scratch memory.'
  }
];

const gallery = docs.flatMap(doc => doc.images.map(item => [item.src, item.caption])).filter((item,index,array)=>array.findIndex(x=>x[0]===item[0])===index);
const tests=[
 ['N1/N2 setpoint clamping','PASS','MaxSP high clamp and 700/500-600 low clamp confirmed against door-open state.'],
 ['N3 PID auto-activation gating','PASS','Injector_Locked, HP_RunningForPID, ThreadingOK and door interlock all confirmed as required conditions.'],
 ['N5/N6 flow vs. orifice coefficient','PASS','Theoretical flow and back-calculated orifice coefficient formulas read directly from CALCULATE blocks.'],
 ['N13 SpareBool15 bypass behavior','PENDING','Confirm in the field which condition actually drives Bool15 TRUE/FALSE during normal operation.'],
 ['N18 30-second mismatch averaging','PENDING','Validate real alarm response time against the documented 30-second window.'],
 ['N21 clog delay timer value','PENDING','Confirm 400 = 40 seconds is the current live setting, not a spare left over from tuning.'],
 ['C1/C2/C3 injector-to-roll mapping','PASS','Confirmed directly against the WE_Sys HMI: C1=InjPT+Inj11+Inj12, C2=Inj21+Inj22, C3=Inj31+Inj32.']
];
const trouble=[
 ['PressMismatchAL fires during speed changes','Check SpareBool5 (N16) — mismatch evaluation should be gated off unless ActualLineSpeed equals ProdSpeed.'],
 ['Orifice coefficient looks wrong right after startup','Confirm N8 sample-and-hold conditions: SP_Auto must be >0 and pressure must be IN_RANGE before CoefAct/ActFlow update the "Last" values.'],
 ['Pump/Injector pressure delta always reads 0','Check SpareBool15 in N13 — TRUE forces the bypass branch, disabling the real delta calculation.'],
 ['ClogMFA never latches despite a visible pressure gap','Verify the gap has to stay above 200 continuously for the full 40-second delay (N21) — a brief spike will not latch it.'],
 ['InjectorUnlockedMFA will not clear','Use the ResetFaults input (N24), not a general HMI reset — confirm Injector_Locked has actually returned TRUE first.'],
 ['Alarm thresholds look different from documentation','Someone may have edited the Int spares manually — pulse SpareBool10 (N22) to restore documented defaults, or compare live values first if the change was intentional.'],
 ['Totals (m³ / energy) reset unexpectedly','This is expected — N11 zeroes both accumulators every time DataReadMES rises from MES.']
];
let view='dashboard',query='';const content=document.getElementById('content');
const kv=o=>`<div class="kv">${Object.entries(o).map(([k,v])=>`<strong>${k}</strong><span>${v}</span>`).join('')}</div>`;
function dashboard(){const completed=tests.filter(t=>t[1]==='PASS').length;content.innerHTML=`<div class="summary-grid"><div class="summary-card"><div class="label">Documented functions</div><div class="value">${docs.length}</div></div><div class="summary-card"><div class="label">Engineering images</div><div class="value">${gallery.length}</div></div><div class="summary-card"><div class="label">Confirmed checks</div><div class="value">${completed}</div></div><div class="summary-card"><div class="label">Pending validations</div><div class="value">${tests.length-completed}</div></div></div><h2 class="section-title">Master project</h2><div class="card-grid"><div class="card"><span class="badge">SOURCE OF TRUTH</span><h3>Perfojet Injector System — FC126 HPGV_Inj</h3><p class="card-subtitle">All 24 networks documented, Line 5 Perfojet area</p><div class="card-body">One instance of FC126 runs per physical injector (Inj11/12, Inj21/22, Inj31/32, plus InjPT), feeding calender rolls C1/C2/C3. Covers pressure control, orifice-wear estimation via flow comparison, and three independent fault paths.</div></div><div class="card"><span class="status completed">LATEST</span><h3>SpareBool Reference</h3><p class="card-subtitle">All 4 spare bits reverse-engineered to real roles</p><div class="card-body">Bool1/Bool2 are P_TRIG edge memories, Bool5 gates mismatch alarms on line speed, Bool10 restores default thresholds, Bool15 bypasses the pressure delta calc.</div></div></div>`}
function codeView(){const f=docs.filter(d=>JSON.stringify(d).toLowerCase().includes(query));content.innerHTML=`<h2 class="section-title">Code Library + Images</h2><div class="card-grid">${f.map((d,i)=>`<article class="card doc-card"><div class="card-head"><div><span class="badge">${d.block}</span><h3>${d.title}</h3><p class="card-subtitle">${d.network}</p></div><span class="status ${d.status}">${d.status.toUpperCase()}</span></div><div class="doc-gallery">${d.images.map(img=>`<figure><img class="doc-image zoom" src="${img.src}" data-caption="${img.caption}"><figcaption>${img.caption}</figcaption></figure>`).join('')}</div><p class="card-body">${d.description}</p>${kv(d.details)}<div class="step-list">${d.steps.map(s=>`<section class="step"><h4>${s.title}</h4><p>${s.text}</p></section>`).join('')}</div><div class="note"><strong>Engineering note:</strong> ${d.notes}</div>${d.code&&d.code.trim()?`<pre id="code-${i}">${escapeHtml(d.code)}</pre><button class="copy-btn" data-copy="code-${i}">Copy code</button>`:''}</article>`).join('')||'<div class="empty">No matches.</div>'}</div>`;bind()}
function galleryView(){const f=gallery.filter(g=>g[1].toLowerCase().includes(query));content.innerHTML=`<h2 class="section-title">Image Gallery</h2><div class="thumb-grid">${f.map(g=>`<div class="thumb"><img class="zoom" src="${g[0]}" data-caption="${g[1]}"><p>${g[1]}</p></div>`).join('')}</div>`;bind()}
function testing(){content.innerHTML=`<h2 class="section-title">Testing & Validation</h2><div class="card-grid">${tests.map(t=>`<div class="card"><span class="status ${t[1]=='PASS'?'completed':'pending'}">${t[1]}</span><h3>${t[0]}</h3><p class="card-body">${t[2]}</p></div>`).join('')}</div>`}
function troubleshooting(){content.innerHTML=`<h2 class="section-title">Troubleshooting</h2><div class="card-grid">${trouble.filter(t=>t.join(' ').toLowerCase().includes(query)).map(t=>`<div class="card"><span class="status issue">REFERENCE</span><h3>${t[0]}</h3><p class="card-body">${t[1]}</p></div>`).join('')}</div>`}
function render(){({dashboard,code:codeView,gallery:galleryView,testing,troubleshooting})[view]();}
function bind(){document.querySelectorAll('.zoom').forEach(img=>img.onclick=()=>openModal(img.src,img.dataset.caption));document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(document.getElementById(b.dataset.copy).innerText).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy code',1200)}));}
function openModal(src,cap){document.getElementById('modalImg').src=src;document.getElementById('modalCaption').textContent=cap;document.getElementById('modal').classList.add('open')}
document.getElementById('closeModal').onclick=()=>document.getElementById('modal').classList.remove('open');document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')e.currentTarget.classList.remove('open')};document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');view=b.dataset.view;render()});document.getElementById('search').oninput=e=>{query=e.target.value.toLowerCase().trim();render()};function escapeHtml(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}render();
