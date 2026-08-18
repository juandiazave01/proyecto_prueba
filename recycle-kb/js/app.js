const docs = [
  {
    title: 'End Roll Alarm Latch',
    block: 'Recycle_CM FC2',
    network: '12A — LATCH_LED',
    status: 'completed',
    images: [{src:'assets/images/endroll-latch-scl.png',caption:'SCL logic for End Roll latch, reset and alarm command'}],
    description: 'Memorizes the End Roll event and keeps the alarm active even after the instantaneous stop condition disappears.',
    details: {Trigger:'Endroll_Stop_Condition',Latch:'EndRoll_Alarm_Latched',Reset:'RecycleSystem_DB...ResetCMD',Output:'New_Louder_Alarm_Cmd'},
    steps:[
      {title:'1. Event detected',text:'Endroll_Stop_Condition becomes TRUE after the selected load-station End Roll timer is confirmed.'},
      {title:'2. Alarm is latched',text:'EndRoll_Alarm_Latched is set and remains TRUE even when the machine stops and the raw detection condition disappears.'},
      {title:'3. Operator reset',text:'The physical Reset button or the TP1200 Reset command clears EndRoll_Alarm_Latched.'},
      {title:'4. Final alarm command',text:'New_Louder_Alarm_Cmd combines the latch, silence state and door permissives before energizing the external indication.'}
    ],
    code:`IF "Endroll_Stop_Condition" THEN
    "EndRoll_Alarm_Latched" := TRUE;
END_IF;

IF "RecycleSystem_DB".RecycleSystem.MachineName.ResetCMD THEN
    "EndRoll_Alarm_Latched" := FALSE;
END_IF;

"New_Louder_Alarm_Cmd" :=
    "EndRoll_Alarm_Latched"
    AND NOT "EndRoll_Alarm_Silenced"
    AND "DoorsOK"
    AND "Wetting_Door_Closed";`,
    notes:'Reset clears the latch. Silence only suppresses the output temporarily; it does not erase the End Roll event.'
  },
  {
    title:'Silence 10 MIN — PLC Tags', block:'PLC Tags / HMI', network:'Alarm Manager', status:'pending',
    images:[{src:'assets/images/silence-tags.png',caption:'PLC tags created for the 10-minute silence function'}],
    description:'Tags used to detect the momentary HMI button, latch the silenced state and count the silence period.',
    details:{HMI:'%M37.7 HMI_Silence_EndRoll_Alarm',Rise:'%M46.4 Silence_EndRoll_Rise',Old:'%M46.5 Silence_EndRoll_Old',Silenced:'%M46.6 EndRoll_Alarm_Silenced',Timer:'%MW50 EndRoll_Silence_TMR'},
    steps:[
      {title:'1. Momentary HMI command',text:'The HMI sets the command when pressed and resets it when released.'},
      {title:'2. Rising-edge detection',text:'Silence_EndRoll_Rise becomes TRUE for one PLC scan when the operator presses the button.'},
      {title:'3. Silence state',text:'EndRoll_Alarm_Silenced remains TRUE during the configured silence interval.'},
      {title:'4. Automatic return',text:'When the timer expires, the silenced state resets and the alarm output can energize again if the End Roll latch is still active.'}
    ],
    code:`"Silence_EndRoll_Rise" :=
    "HMI_Silence_EndRoll_Alarm"
    AND NOT "Silence_EndRoll_Old";

"Silence_EndRoll_Old" :=
    "HMI_Silence_EndRoll_Alarm";`,
    notes:'The Silence button should be visible only while EndRoll_Alarm_Latched is TRUE.'
  },
  {
    title:'Validation Counters', block:'Recycle_CM FC3 "Machine"', network:'NW33 — New_LED / Latch_Counter', status:'pending',
    images:[
      {src:'assets/images/two-validation-counters.png',caption:'Two independent counters for physical light and End Roll events'},
      {src:'assets/images/alarm-counters-original.png',caption:'Original alarm counter logic used during validation'},
      {src:'assets/images/new-louder-counter.png',caption:'Counter for New_Louder_Light activations'}
    ],
    description:'Two separate counters compare physical alarm-output activations with real End Roll events before the two signals are permanently connected. Confirmed to live in FC3 "Machine" Network 33, right after the New_Louder_Light generation logic in NW32 (see "FC3 Machine — Complete Sequencer Documentation").',
    details:{Counter1:'DB10 New_LED',Source1:'New_Louder_Light',Counter2:'DB9 Latch_Counter',Source2:'EndRoll_Alarm_Latched'},
    steps:[
      {title:'1. Count physical output',text:'A positive edge of New_Louder_Light increments DB10 New_LED once each time the external light turns on.'},
      {title:'2. Count End Roll events',text:'A positive edge of EndRoll_Alarm_Latched increments DB9 Latch_Counter once per new End Roll event.'},
      {title:'3. Compare results',text:'The counters are expected to match during basic testing, but may differ later because Silence or door interlocks can turn the same light off and on more than once for a single latched event.'},
      {title:'4. Where New_Louder_Light comes from',text:'NW32 (same FC3 block) generates New_Louder_Light as (RedLight AND DoorsOK AND Wetting_Door_Closed) OR End_Roll_Activated, where End_Roll_Activated is a direct relay of EndRoll_Alarm_Latched (originally set in Recycle_CM FC2 NW12A). See the FC3 Machine doc for the full NW32 logic.'}
    ],
    code:`New_Louder_Light --[P]--> CTUD New_LED
EndRoll_Alarm_Latched --[P]--> CTUD Latch_Counter`,
    notes:'These counters measure different things: End Roll events versus physical light energizations. Block attribution corrected 2026-08-18: this is FC3 "Machine" NW33, not a standalone network.'
  },
  {
    title:'Positive Edge Memories', block:'Recycle_CM FC3 "Machine"', network:'NW33 — P contacts', status:'completed',
    images:[{src:'assets/images/positive-edge-memories.png',caption:'Separate memory bits used by the two positive-edge contacts'}],
    description:'Each positive-edge detector uses an independent memory bit so only FALSE-to-TRUE transitions are counted. Confirmed to live in FC3 "Machine" Network 33.',
    details:{Signal1:'Pulse_counter',Memory1:'M_pulse',Signal2:'Pulse_counter1',Memory2:'M_pulse1'},
    steps:[{title:'Rule',text:'Never reuse the same edge-memory bit for two different signals. Each P contact needs its own previous-state memory.'}],
    code:`Pulse_counter  -> P using M_pulse
Pulse_counter1 -> P using M_pulse1`,
    notes:'The P instruction creates one PLC-scan pulse only when its monitored signal changes from FALSE to TRUE. Block attribution corrected 2026-08-18: this is FC3 "Machine" NW33, not a standalone network.'
  },
  {
    title:'Feed Press Rolls During JOG', block:'RecycleSystem FC4', network:'NW12 Press Rolls Operations', status:'completed',
    images:[
      {src:'assets/images/recyclesystem-network12.jpeg',caption:'RecycleSystem FC4 Network 12 with JOG branches'},
      {src:'assets/images/hmi-jog-silence.jpeg',caption:'TP1200 main screen with Hold-to-Run JOG button'}
    ],
    description:'During JOG, both pneumatic press-roll cylinders are commanded through the manual path of their PilotValve instances.',
    details:{Command:'Jog_FeedPress_CMD',Door:'Wetting_Door_Closed',Valve1:'3428SOL2.Hand_Activate',Valve2:'3429SOL1.Hand_Activate'},
    steps:[
      {title:'1. JOG command',text:'Jog_FeedPress_CMD follows Jog_Web_Active while the operator holds the HMI button.'},
      {title:'2. Door permissive',text:'Wetting_Door_Closed must remain TRUE.'},
      {title:'3. Manual valve command',text:'Normal coils write Hand_Activate for both 3428SOL2 and 3429SOL1.'},
      {title:'4. Automatic release',text:'When JOG is released or the door opens, the normal coils become FALSE and the cylinders release.'}
    ],
    code:`Jog_FeedPress_CMD AND Wetting_Door_Closed
    -> 3428SOL2.Hand_Activate
    -> 3429SOL1.Hand_Activate`,
    notes:'Use normal coils, not SET coils. Do not write the physical outputs directly.'
  },
  {
    title:'Synchronized Web JOG', block:'Recycle_CM FC2 / MotorG120 FC102', network:'Jog Function', status:'completed',
    images:[{src:'assets/images/hmi-jog-silence.jpeg',caption:'TP1200 Hold-to-Run JOG control'}],
    description:'Moves five web motors together at a reduced proportional line speed while the machine is in Manual and outside Production.',
    details:{Speed:'15.0 m/min',Motors:'1214CU1, 1314CU1, 1514CU1, 1614CU1, 1714CU1',Method:'SpecialSP + proportional scaling'},
    steps:[
      {title:'1. Permission',text:'Manual TRUE, Production FALSE, SafetyOK TRUE and Fault FALSE.'},
      {title:'2. Momentary activation',text:'Jog_Web_Active is TRUE only while the HMI button is held.'},
      {title:'3. Scale calculation',text:'Jog_Scale equals Jog_LineSpeed_SP divided by MachineSpeed_SP.'},
      {title:'4. Motor commands',text:'Each motor SpecialSP follows Jog_Web_Active and SP_SpecialSpeed equals SP_AutoSpeed multiplied by Jog_Scale.'}
    ],
    code:`"Jog_LineSpeed_SP" := 15.0;

"Jog_Web_Allowed" :=
    MachineName.Manual
    AND NOT MachineName.Production
    AND MachineName.SafetyOK
    AND NOT MachineName.Fault;

"Jog_Web_Active" := "HMI_Jog_Web" AND "Jog_Web_Allowed";

Motor.SpecialSP := "Jog_Web_Active";
Motor.SP_SpecialSpeed := Motor.SP_AutoSpeed * "Jog_Scale";`,
    notes:'MotorG120 FC102 must accept SpecialSP as a valid run source and use SP_SpecialSpeed for the command.'
  },
  {
    title: 'PilotValve FC104 — Complete Function Documentation',
    block: 'PilotValve FC104',
    network: 'Interface + NW2 to NW6 + Call Example',
    status: 'completed',
    images: [
      { src: 'assets/images/pilotvalve-interface.png', caption: '1. FC104 interface: inputs, output, InOut ValveName and temporary ENA_ACTIVATE' },
      { src: 'assets/images/pilotvalve-enable-trigger.png', caption: '2. NW2 Enable Activation and NW3 Activate Trigger' },
      { src: 'assets/images/pilotvalve-output-position.png', caption: '3. NW4 output command and NW5 feedback / position monitoring' },
      { src: 'assets/images/pilotvalve-fault-handler.png', caption: '4. NW6 wrong-position fault timer and reset' },
      { src: 'assets/images/pilotvalve-call-inlet-press-roll.png', caption: '5. Example call from Recycle_CM FC2, NW24 Inlet Press Roll' }
    ],
    description: 'FC104 is the reusable 2-way pneumatic valve control block. It validates safety and enable conditions, selects either the manual or automatic command path, writes the physical output, verifies valve position feedback, and generates a WrongPosFault if the commanded position is not reached in the allowed time.',
    details: {
      'Type': 'FC104 — LAD Function','Valve structure': 'Valve2Way via ValveName InOut','Manual command': 'Hand_Mode = TRUE and Hand_Activate = TRUE','Automatic command': 'Hand_Mode = FALSE and Activate = TRUE','Enable conditions': 'SafetyOK AND Enable AND NOT WrongPosFault','Physical output': 'ValveOn_OUT','Example instance': '3428SOL2 — Inlet Press Roll','Example output': '%Q18.6 InletPR_MoveToWork','Feedback': '%I10.2 InletPR_WorkPos','Fault delay': 'FaultTime_SP_IN = 50 counts'
    },
    steps: [
      { title: '1. Interface and data flow', text: 'The block receives four feedback-related inputs, one fault time setting, one physical output, and the complete Valve2Way structure through ValveName. ValveName contains SafetyOK, Enable, Hand_Mode, Hand_Activate, Activate, InPos, Reset, WrongPosFault and FaultTMR. ENA_ACTIVATE is an internal temporary bit.' },
      { title: '2. NW2 — Enable Activation', text: 'ENA_ACTIVATE becomes TRUE only when ValveName.SafetyOK and ValveName.Enable are TRUE and ValveName.WrongPosFault is FALSE. This is the main permissive used by the command logic.' },
      { title: '3. NW3 — Activate Trigger', text: 'There are two command paths. Manual path: Hand_Mode AND Hand_Activate. Automatic path: NOT Hand_Mode AND Activate. Either path must also pass ENA_ACTIVATE before the internal ACTIVATE command is energized.' },
      { title: '4. NW4 — Set Output', text: 'The internal ACTIVATE bit is copied directly to ValveOn_OUT. At the FC call, ValveOn_OUT is wired to the real PLC output such as %Q18.6 InletPR_MoveToWork.' },
      { title: '5. NW5 — Monitor Position', text: 'When ACTIVATE is TRUE, the block evaluates the ON-position feedback if Ena_OnFB_IN is enabled. When ACTIVATE is FALSE, it evaluates the OFF-position feedback if Ena_OffFB_IN is enabled. The result is stored in ValveName.InPos. If a feedback channel is disabled, the rung treats that direction as accepted.' },
      { title: '6. NW6 — Handle Fault', text: 'If the valve is enabled but InPos remains FALSE, the block increments ValveName.FaultTMR using the 0.1-second pulse. When FaultTMR reaches FaultTime_SP_IN, WrongPosFault is SET. If the mismatch condition disappears, FaultTMR is moved back to zero. ValveName.Reset resets WrongPosFault.' },
      { title: '7. Call example — Recycle_CM FC2 NW24', text: 'The 3428SOL2 valve instance is passed into ValveName. ON feedback is enabled and connected to %I10.2 InletPR_WorkPos. OFF feedback is disabled. FaultTime_SP_IN is 50. ValveOn_OUT drives %Q18.6 InletPR_MoveToWork.' },
      { title: '8. JOG integration lesson', text: 'For JOG operation the correct command is ValveName.Hand_Activate while Hand_Mode is TRUE. Writing ValveName.Activate during Manual mode does not use the active manual branch and therefore will not move the valve.' }
    ],
    code: `// Internal command selection in PilotValve FC104

ENA_ACTIVATE :=
    ValveName.SafetyOK
    AND ValveName.Enable
    AND NOT ValveName.WrongPosFault;

ACTIVATE :=
    ((ValveName.Hand_Mode AND ValveName.Hand_Activate)
    OR ((NOT ValveName.Hand_Mode) AND ValveName.Activate))
    AND ENA_ACTIVATE;

ValveOn_OUT := ACTIVATE;

// JOG command used by the caller
3428SOL2.Hand_Activate :=
    Jog_FeedPress_CMD AND Wetting_Door_Closed;`,
    notes: 'Engineering lesson: do not bypass FC104 or write the physical output directly. Use Activate for automatic operation and Hand_Activate for Manual/JOG operation so that SafetyOK, Enable, position supervision, timer and WrongPosFault remain active.'
  },
  {
    title: 'FC3 "Machine" — Complete Sequencer Documentation',
    block: 'Recycle_CM FC3 "Machine"',
    network: 'NW1 to NW34 (full block)',
    status: 'completed',
    images: [
      { src: 'assets/images/machine-call-interface.png', caption: '0. Call interface: Recycle_CM FC2 NW3 "Call Machine" — SafetyOK, DoorsOK, stage conditions, stage timers, ShortStage1' },
      { src: 'assets/images/machine-nw1-3-ready1.png', caption: '1. NW1-3: Safety state passthrough and Ready1 (ready for first start pushbutton)' },
      { src: 'assets/images/machine-nw8-9-voicealarm.png', caption: '2. NW8-9: Voice alarm for 5s after first PB, then StartOK is set' },
      { src: 'assets/images/machine-nw12-13-ready2-stage1.png', caption: '3. NW12-13: Ready2 (ready for second PB) and the jump to Stage 1' },
      { src: 'assets/images/machine-nw14-15-startramp.png', caption: '4. NW14-15: Timed stage ramp during start (Stage1->2->3)' },
      { src: 'assets/images/machine-nw18-19-stopping.png', caption: '5. NW18-19: Machine Stopping trigger and immediate Stage4->3 / conditional retreat' },
      { src: 'assets/images/machine-nw23-24-emergencystop.png', caption: '6. NW23-24: Final stop cleanup and Emergency Stopping (JD change 07/09/2026)' },
      { src: 'assets/images/machine-nw25-faultreset.png', caption: '7. NW25: Machine Fault reset (ResetCMD, self-clearing pulse)' },
      { src: 'assets/images/machine-nw26-28-stagebits.png', caption: '8. NW26-28: Stop indicator and cumulative Stage1/Stage2 bits' },
      { src: 'assets/images/machine-nw32-newlight.png', caption: '9. NW32: New_Louder_Light generation (JD change 07/23/2026), linked to EndRoll_Alarm_Latched' }
    ],
    description: 'FC3 "Machine" is the master two-pushbutton start/stop stage sequencer for the recycle system. It validates safety/door/precondition permissives, runs a 2-PB start sequence with a 5-second audible warning and a 60-second confirmation window, ramps the machine through Stage 1-4 (Stage 4 = Production) with per-stage timers, ramps back down through the same stages on Stop/Fault, handles fault reset, publishes cumulative stage-reached bits for the HMI and other logic, and includes an Emergency Stopping path that bypasses the timed ramp entirely.',
    details: {
      'Type': 'FC3 — LAD Function, called once per system instance via #SystemName InOut',
      'Interlocks maestros': 'SafetyOK, DoorsOK, PreCond1, PreCond2',
      'Start sequence': '2 pushbuttons: Ready1 -> PB1 -> 5s Voice Alarm -> StartOK (60s window) -> Ready2 -> PB2 -> Stage 1',
      'Stage ramp (start)': 'Stage1->2->3->4, each transition after StageNStartTime seconds while Starting=1',
      'Stage ramp (stop)': 'Stage4->3 immediate, then 3->2->1->0 after StageNStopTime (or StopCond permissives / ShortStage1)',
      'Emergency Stopping (JD 07/09/2026)': 'Forces Stage:=0 immediately on loss of SafetyOK, or on Endroll_Stop_Condition AND HMI_Confirmation_Endroll',
      'Fault reset': 'ResetCMD clears Fault/FaultI/FaultM and self-clears after ResetCMDTime (0.1s pulse count)',
      'Stage bits': 'Stage1..Stage4 are cumulative (Stage>=N), used by HMI and other logic',
      'New_Louder_Light (JD 23/07/2026)': 'NW32: (RedLight AND DoorsOK AND Wetting_Door_Closed) OR End_Roll_Activated; End_Roll_Activated relays EndRoll_Alarm_Latched (set in FC2 NW12A) — feeds the counters documented in "Validation Counters" / "Positive Edge Memories"'
    },
    steps: [
      { title: '1. NW1-2 — Safety passthrough', text: 'SafetyOK and DoorsOK inputs are copied directly into Machine_Name.SafetyOK and Machine_Name.DoorsClosed.' },
      { title: '2. NW3 — Ready for First PB', text: 'Ready1 = Stage==0 AND (Enable OR M1.2 "AlwaysTRUE") AND PreCond1 AND PreCond2 AND SafetyOK AND DoorsOK AND NOT StartOK AND NOT Fault AND NOT FaultI AND NOT Manual. Note: M1.2 "AlwaysTRUE" in OR with Enable potentially bypasses that interlock — same pattern repeats in NW12 (Ready2), pending confirmation of intent.' },
      { title: '3. NW4-7 — Restart handling and mode gating', text: 'NW4 lets the operator abort an in-progress Stopping sequence by pressing Start again. NW5 discards invalid Start presses. NW6 clears Production/Starting/Stopping at Stage 0. NW7 forces Manual off whenever Stage>0 — the machine cannot be considered "Manual" while any stage is active.' },
      { title: '4. NW8-11 — Two-pushbutton start sequence', text: 'PB1 (Ready1+StartCMD) sets a 5-second Voice Alarm (NW8-9); once it elapses, StartOK opens a 60-second window (NW10) during which PB2 can be pressed (Ready2, NW12). NW11 aborts StartOK immediately if any permissive drops before the window elapses.' },
      { title: '5. NW12-13 — Second PB and Stage 1', text: 'Ready2 mirrors Ready1 but requires StartOK=1. Ready2+StartCMD moves Stage to 1, clears StartOK, and sets Starting — this is where the machine physically begins to run.' },
      { title: '6. NW14-17 — Timed start ramp', text: 'While Starting=1 and at each stage, a software timer (ADD block clocked by PLS_1sec) counts up; on reaching StageNStartTime it advances Stage to N+1 and resets the timer. Stage 4 sets Production=1 (NW17) and clears StartCMD/Starting.' },
      { title: '7. NW18-22 — Stop trigger and timed stop ramp', text: 'NW18: Stage>0 AND (StopCMD OR Fault OR FaultI) sets Stopping. NW19: on the Stopping edge (or StopMem, source not yet traced), Stage4 drops to 3 immediately; Stage2/Stage1 only drop immediately if their respective StopCond is satisfied, otherwise NW20-22 handle the timed fallback (StageNStopTime), with ShortStage1 able to skip the final wait.' },
      { title: '8. NW23 — Final cleanup', text: 'Once Stage reaches 0, Stopping/Starting/StartCMD/StopCMD are all cleared.' },
      { title: '9. NW24 — Emergency Stopping (JD change 07/09/2026)', text: 'Bypasses the entire timed ramp: forces Stage:=0 instantly if SafetyOK is lost while running, OR if Endroll_Stop_Condition AND HMI_Confirmation_Endroll are both true. The second condition is the user-added path, tying the End Roll alarm into an immediate full stop instead of a graceful ramp-down.' },
      { title: '10. NW25 — Fault reset', text: 'ResetCMD clears Fault, FaultI and FaultM, and self-clears after ResetCMDTime (counted in 0.1s pulses) — a self-stretching reset pulse.' },
      { title: '11. NW26-30 — Stage indicator bits', text: 'Stage==0 drives a Stop indicator; NW27-30 derive cumulative Stage1..Stage4 bits (Stage>=N) for use by the HMI and other logic blocks.' },
      { title: '12. NW31 — Unrelated motor fault flag', text: 'Checks RecycleCM_DB.Recycle_CM."1414CU1".MotorState_HMI==4 and sets M46.7 "Unravel Roll HMI_Fault" — not part of the Stage sequencer, appears to be placed in this FC incidentally. Candidate for separate documentation of motor 1414CU1.' },
      { title: '13. NW32-33 — New_Louder_Light and validation counters (JD change 23/07/2026)', text: 'NW32 generates Q19.7 New_Louder_Light from RedLight/DoorsOK/WettingDoorClosed OR End_Roll_Activated (a relay of EndRoll_Alarm_Latched from FC2 NW12A). NW33 feeds both New_Louder_Light and End_Roll_Activated into the CTUD counters already documented separately under "Validation Counters" and "Positive Edge Memories" — confirmed here to belong to this same FC3 block.' }
    ],
    code: `// Start sequence (simplified)
Ready1 := (Stage==0) AND (Enable OR AlwaysTRUE) AND PreCond1 AND PreCond2
        AND SafetyOK AND DoorsOK AND NOT StartOK AND NOT Fault AND NOT FaultI AND NOT Manual;

IF Ready1 AND StartCMD THEN
    VoiceAlarm := TRUE;   // 5 s audible warning
    StartCMD := FALSE;
END_IF;

// after 5 s of VoiceAlarm -> StartOK := TRUE (60 s window opens)

Ready2 := (Stage==0) AND (Enable OR AlwaysTRUE) AND PreCond1 AND PreCond2
        AND SafetyOK AND DoorsOK AND StartOK AND NOT Fault AND NOT FaultI;

IF Ready2 AND StartCMD THEN
    Stage := 1;
    StartOK := FALSE;
    Starting := TRUE;
END_IF;

// Timed ramp: Stage N -> N+1 after StageNStartTime, while Starting=1
// Stage 4 => Production := TRUE

// Stop path
IF Stage>0 AND (StopCMD OR Fault OR FaultI) THEN
    Stopping := TRUE;
    Starting := FALSE;
    StartCMD := FALSE;
END_IF;
// Stage4->3 immediate, then timed ramp down to 0

// Emergency Stopping (JD 07/09/2026)
IF (Stage>0 AND NOT SafetyOK) OR (Endroll_Stop_Condition AND HMI_Confirmation_Endroll) THEN
    Stage := 0;  // bypasses the timed ramp entirely
END_IF;`,
    notes: 'Two user modifications are dated inside this block: NW24 "Emergency Stopping" (07/09/2026) and NW32 "New Light" (23/07/2026) — both tie the End Roll alarm into this sequencer (immediate stop, and the New_Louder_Light output). Open items: origin of StopMem (NW19), exact meaning of FaultI/FaultM, whether M1.2 "AlwaysTRUE" bypassing Enable in NW3/NW12 is intentional, and which OB/FC calls "Call Machine".'
  }
];

const gallery = docs.flatMap(doc => doc.images.map(item => [item.src, item.caption])).filter((item,index,array)=>array.findIndex(x=>x[0]===item[0])===index);
const tests=[
 ['Synchronized JOG motors','PASS','Five web motors move at proportional reduced speed.'],
 ['Feed press cylinders during JOG','PASS','3428SOL2 and 3429SOL1 lower while JOG is held.'],
 ['PilotValve manual command path','PASS','Hand_Activate is used while Hand_Mode is TRUE.'],
 ['End Roll latch reset','PENDING','Confirm latch clears from physical/HMI Reset.'],
 ['Silence 10 MIN','PENDING','Confirm alarm output turns off and automatically returns after timeout.'],
 ['Validation counters','PENDING','Compare End Roll events against physical light activations.']
];
const trouble=[
 ['JOG visible but motors do not move','Check HMI_Jog_Web, Jog_Web_Allowed, Jog_Web_Active, SpecialSP, SP_SpecialSpeed and SpeedCMD.'],
 ['Motors move but cylinders do not lower','Use PilotValve.Hand_Activate in Manual; check SafetyOK, Enable, WrongPosFault, Q18.6 and Q18.7.'],
 ['Valve does not move in Manual/JOG','Check Hand_Mode and Hand_Activate. Do not use Activate in the manual branch.'],
 ['WrongPosFault becomes active','Verify position feedback wiring and FaultTime_SP_IN before resetting the fault.'],
 ['Machine remains in Stage 3','Verify FiberRequest_IN. Stage 3 is normal while the line is not requesting fiber.'],
 ['Silence button stays visible','Configure HMI Visibility, not only Control Enable, using EndRoll_Alarm_Latched.'],
 ['Counters do not increment','Count a positive edge of the final signal; do not use a periodic 0.1-second pulse for event counting.']
];
let view='dashboard',query='';const content=document.getElementById('content');
const kv=o=>`<div class="kv">${Object.entries(o).map(([k,v])=>`<strong>${k}</strong><span>${v}</span>`).join('')}</div>`;
function dashboard(){const completed=tests.filter(t=>t[1]==='PASS').length;content.innerHTML=`<div class="summary-grid"><div class="summary-card"><div class="label">Documented functions</div><div class="value">${docs.length}</div></div><div class="summary-card"><div class="label">Engineering images</div><div class="value">${gallery.length}</div></div><div class="summary-card"><div class="label">Completed tests</div><div class="value">${completed}</div></div><div class="summary-card"><div class="label">Pending validations</div><div class="value">${tests.length-completed}</div></div></div><h2 class="section-title">Master project</h2><div class="card-grid"><div class="card"><span class="badge">SOURCE OF TRUTH</span><h3>RecycleMachine KB Master</h3><p class="card-subtitle">All previous documentation plus every new block</p><div class="card-body">From this version forward, every release will be created from the latest Master project. Existing functions will never be removed unless explicitly requested.</div></div><div class="card"><span class="status completed">LATEST</span><h3>FC3 "Machine" Sequencer</h3><p class="card-subtitle">Complete function documentation</p><div class="card-body">Full NW1–NW34: two-PB start sequence, stage ramp, Emergency Stopping and New Louder Light (both user modifications), fault reset, stage bits.</div></div></div>`}
function codeView(){const f=docs.filter(d=>JSON.stringify(d).toLowerCase().includes(query));content.innerHTML=`<h2 class="section-title">Code Library + Images</h2><div class="card-grid">${f.map((d,i)=>`<article class="card doc-card"><div class="card-head"><div><span class="badge">${d.block}</span><h3>${d.title}</h3><p class="card-subtitle">${d.network}</p></div><span class="status ${d.status}">${d.status.toUpperCase()}</span></div><div class="doc-gallery">${d.images.map(img=>`<figure><img class="doc-image zoom" src="${img.src}" data-caption="${img.caption}"><figcaption>${img.caption}</figcaption></figure>`).join('')}</div><p class="card-body">${d.description}</p>${kv(d.details)}<div class="step-list">${d.steps.map(s=>`<section class="step"><h4>${s.title}</h4><p>${s.text}</p></section>`).join('')}</div><div class="note"><strong>Engineering note:</strong> ${d.notes}</div><pre id="code-${i}">${escapeHtml(d.code)}</pre><button class="copy-btn" data-copy="code-${i}">Copy code</button></article>`).join('')||'<div class="empty">No matches.</div>'}</div>`;bind()}
function galleryView(){const f=gallery.filter(g=>g[1].toLowerCase().includes(query));content.innerHTML=`<h2 class="section-title">Image Gallery</h2><div class="thumb-grid">${f.map(g=>`<div class="thumb"><img class="zoom" src="${g[0]}" data-caption="${g[1]}"><p>${g[1]}</p></div>`).join('')}</div>`;bind()}
function testing(){content.innerHTML=`<h2 class="section-title">Testing & Validation</h2><div class="card-grid">${tests.map(t=>`<div class="card"><span class="status ${t[1]=='PASS'?'completed':'pending'}">${t[1]}</span><h3>${t[0]}</h3><p class="card-body">${t[2]}</p></div>`).join('')}</div>`}
function troubleshooting(){content.innerHTML=`<h2 class="section-title">Troubleshooting</h2><div class="card-grid">${trouble.filter(t=>t.join(' ').toLowerCase().includes(query)).map(t=>`<div class="card"><span class="status issue">REFERENCE</span><h3>${t[0]}</h3><p class="card-body">${t[1]}</p></div>`).join('')}</div>`}
function render(){({dashboard,code:codeView,gallery:galleryView,testing,troubleshooting})[view]();}
function bind(){document.querySelectorAll('.zoom').forEach(img=>img.onclick=()=>openModal(img.src,img.dataset.caption));document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(document.getElementById(b.dataset.copy).innerText).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy code',1200)}));}
function openModal(src,cap){document.getElementById('modalImg').src=src;document.getElementById('modalCaption').textContent=cap;document.getElementById('modal').classList.add('open')}
document.getElementById('closeModal').onclick=()=>document.getElementById('modal').classList.remove('open');document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')e.currentTarget.classList.remove('open')};document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');view=b.dataset.view;render()});document.getElementById('search').oninput=e=>{query=e.target.value.toLowerCase().trim();render()};function escapeHtml(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}render();
