# SPEC — ARIA · "Turno de noche" (storyline A)

GOAL:    a Line 4 technician or manager ends thinking "with ARIA, a fault at 2 a.m. has a path: guide, drawing, and memory".
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps
TIME:    36 s x 30 = 1080 frames. Silent (no music source until HeyGen sign-in).
LOOK:    two worlds.
         Plant: Cab 30 interior. Galvanised back plate #aeb4bb→#8f969e (vertical gradient), grey slotted wire ducts #6b7280,
         DIN rail #c7ccd2, Pilz PSWZ X1P module yellow #f2c200 with black face #1f2937, Phoenix PSR-EA4 green #2f7d32.
         Night light: 35% blue-black overlay #0b1222 at the edges (vignette 30%).
         App: ARIA's own palette. Ground #0b1222 with the phone as hero (960 px tall = 89% of frame height).
         Ink #f1f5f9, ARIA cyan #22d3ee (FOR Card), fault red #ef4444, run green #22c55e.
         Display: Inter 900, 96-120 px, tracking -2%. Lines: Inter 700, 54-64 px. UI rebuilds: IBM Plex Mono 500, 30-34 px.
OBJECTS: Pilz relay (yellow body, 3 LEDs POWER/OUTPUT/FAULT, label 30-PSR1), Phoenix relay beside it, phone with ARIA (real screenshots),
         fingertip (64 px soft white disc) for taps.
MOTION:  arrivals expo.out 0.5-0.7 s; camera power2.inOut 0.8-1.2 s; exits power3.in 0.3 s. Per-word title blur-in 0.13 s, 0.07 s apart.
         Taps: finger travels 0.45 s power2.inOut, press 0.12 s, screen swap on the press frame.
SHOTS:
  1  0.0-5.2   planta: Cab 30 wide → push to the FAULT LED blinking red. "02:47 · Gabinete 30" then "La Línea 4 se detiene".
               Hand-off: the red LED grows past the frame (object becomes world).
  2  5.2-7.8   alerta: red field. "FAULT" huge, then "¿Por dónde empiezo?". Phone rises from below (carry).
  3  7.8-21.0  app: phone with ARIA home → tap SAFETY → Pilz card (red FAU) → tap → expanded → FAULT ON guide rebuilt at 2x
               beside the phone, 5 steps land one by one → tap DRAWINGS → fault-guide row "E-stop no resetea" rebuilt beside.
               Titles: "ARIA · copiloto de mantenimiento", "La guía, paso a paso", "Y el plano que lo respalda".
  4  21.0-24.5 resuelto: back in Cab 30 (whip). FAULT off, OUTPUT green. "03:12 · Línea en marcha".
  5  24.5-31.5 memoria: phone shows Mech Log, pulls back; real numbers land: 667 notas de turno · 202 días · 144 equipos · 511 h;
               Pareto bars (EK150 71h, FOR Card 47h, Willow Card 35h, Dryer 29h, Perfojet Injector 23h, Blending Mixers 20h).
               Line: "Lo que aprende un turno, lo sabe toda la línea".
  6  31.5-36.0 cierre: "Todo el conocimiento de la Línea 4, en una app" → green LED becomes the ◉ of the ARIA wordmark, typed in,
               "LINE 4 — SPUNTECH" under it; hold 2.5 s.
BANNED:  glow/bloom/particles; purple gradients; glass cards; three cards in a row; title over a dimmed screenshot; logo docked in a corner;
         every element fading + sliding up; invented ARIA screens or answers (the live chat is not shown — it cannot be captured);
         claims not in ARIA itself.
QA:      2.0 (cabinet reads as a cabinet, LED red), 4.9 (flood), 6.6 (question), 9.5 (home + tap), 13.5 (guide steps readable >= 28 px),
         18.5 (drawings row), 22.5 (green), 28 (numbers + Pareto), 34.5 (end card).
NOTE:    the night scenario is a dramatisation; the device, its FAULT state (noted 2026-06-26) and the guide text are ARIA's own.
