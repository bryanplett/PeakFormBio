// ─── Exercise Database ────────────────────────────────────────────────────────
// Jefit-style library: each exercise carries the muscles it works (normalized to
// the MuscleMap region keys), equipment, mechanic, step-by-step instructions and
// coaching tips. Names are kept identical to workout-builder.jsx / workout-editor
// so a coach-assigned plan_data resolves cleanly against this library.
//
// Normalized muscle keys (used by wt-musclemap.jsx):
//   chest, frontDelts, sideDelts, rearDelts, traps, lats, lowerBack,
//   biceps, triceps, forearms, abs, obliques, quads, hamstrings, glutes, calves
//
// group  → coarse body-part used for the library filter chips
// equip  → Barbell | Dumbbell | Machine | Cable | Bodyweight | Band

window.MUSCLE_LABELS = {
  chest: 'Chest', frontDelts: 'Front Delts', sideDelts: 'Side Delts', rearDelts: 'Rear Delts',
  traps: 'Traps', lats: 'Lats', lowerBack: 'Lower Back', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Forearms', abs: 'Abs', obliques: 'Obliques', quads: 'Quads',
  hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
};

window.EXERCISE_DB = [
  // ── CHEST ───────────────────────────────────────────────────────────────
  { id: 'bb-bench', name: 'Barbell Bench Press', group: 'Chest', equip: 'Barbell', mechanic: 'Compound',
    primary: ['chest'], secondary: ['frontDelts', 'triceps'],
    instructions: [
      'Lie flat, eyes under the bar, feet planted. Grip just wider than shoulder-width.',
      'Unrack and bring the bar over your chest with arms straight.',
      'Lower under control to mid-chest, elbows tucked ~45°.',
      'Press back up and slightly back over the shoulders. Keep glutes on the bench.',
    ],
    tips: ['Squeeze the bar and keep your shoulder blades pinned back and down.', 'Touch the same point on your chest every rep for consistency.'] },
  { id: 'incline-db', name: 'Incline Dumbbell Press', group: 'Chest', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['chest', 'frontDelts'], secondary: ['triceps'],
    instructions: [
      'Set the bench to ~30°. Sit back with a dumbbell on each thigh.',
      'Kick the weights up to shoulder level, palms facing forward.',
      'Press up and slightly together until arms are extended.',
      'Lower with control until you feel a stretch across the upper chest.',
    ],
    tips: ['Keep the bench under 45° — steeper turns it into a shoulder press.'] },
  { id: 'db-bench', name: 'Dumbbell Bench Press', group: 'Chest', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['chest'], secondary: ['frontDelts', 'triceps'],
    instructions: [
      'Lie flat with a dumbbell in each hand at chest level.',
      'Press both up until arms are extended, weights nearly touching.',
      'Lower slowly to a deep stretch, elbows at ~45°.',
    ],
    tips: ['Greater range of motion than the barbell — control the bottom.'] },
  { id: 'cable-fly', name: 'Cable Fly', group: 'Chest', equip: 'Cable', mechanic: 'Isolation',
    primary: ['chest'], secondary: ['frontDelts'],
    instructions: [
      'Set both pulleys to chest height. Grab a handle in each hand, step forward.',
      'With a slight elbow bend, bring your hands together in a hugging arc.',
      'Squeeze at the midline, then return to a controlled stretch.',
    ],
    tips: ['Lead with the elbows, not the hands. Keep tension throughout.'] },
  { id: 'pushup', name: 'Push-Up', group: 'Chest', equip: 'Bodyweight', mechanic: 'Compound',
    primary: ['chest'], secondary: ['triceps', 'frontDelts', 'abs'],
    instructions: [
      'Hands slightly wider than shoulders, body in a straight line.',
      'Lower your chest toward the floor, elbows ~45°.',
      'Press back up, bracing your core the whole way.',
    ],
    tips: ['Squeeze glutes and abs so your hips never sag.'] },
  { id: 'dips', name: 'Dips', group: 'Chest', equip: 'Bodyweight', mechanic: 'Compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts'],
    instructions: [
      'Support yourself on parallel bars, arms locked.',
      'Lean slightly forward and lower until shoulders are below elbows.',
      'Press back up to lockout.',
    ],
    tips: ['Lean forward for chest, stay upright for triceps.'] },

  // ── BACK ────────────────────────────────────────────────────────────────
  { id: 'pullup', name: 'Pull-Up', group: 'Back', equip: 'Bodyweight', mechanic: 'Compound',
    primary: ['lats'], secondary: ['biceps', 'rearDelts', 'traps'],
    instructions: [
      'Hang from a bar with an overhand grip, slightly wider than shoulders.',
      'Pull your elbows down and back until your chin clears the bar.',
      'Lower under control to a full hang.',
    ],
    tips: ['Think about driving your elbows to your back pockets.'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', group: 'Back', equip: 'Machine', mechanic: 'Compound',
    primary: ['lats'], secondary: ['biceps', 'rearDelts'],
    instructions: [
      'Grip the bar wider than shoulders, thighs locked under the pad.',
      'Pull the bar to your upper chest, driving elbows down.',
      'Control the bar back up to a full stretch.',
    ],
    tips: ['Lead with the elbows and keep a slight chest-up lean.'] },
  { id: 'bb-row', name: 'Barbell Row', group: 'Back', equip: 'Barbell', mechanic: 'Compound',
    primary: ['lats', 'traps'], secondary: ['biceps', 'rearDelts', 'lowerBack'],
    instructions: [
      'Hinge at the hips to ~45°, soft knees, neutral spine.',
      'Pull the bar to your lower ribs, elbows back.',
      'Lower under control without rounding your back.',
    ],
    tips: ['Brace hard — the hinge position protects your lower back.'] },
  { id: 'db-row', name: 'Dumbbell Row', group: 'Back', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['lats'], secondary: ['biceps', 'traps', 'rearDelts'],
    instructions: [
      'One knee and hand on the bench, other foot planted.',
      'Let the dumbbell hang, then row it to your hip.',
      'Squeeze the back, lower to a full stretch.',
    ],
    tips: ['Pull to the hip, not the shoulder, to bias the lats.'] },
  { id: 'cable-row', name: 'Seated Cable Row', group: 'Back', equip: 'Cable', mechanic: 'Compound',
    primary: ['lats', 'traps'], secondary: ['biceps', 'rearDelts'],
    instructions: [
      'Sit tall, feet on the platform, slight knee bend.',
      'Pull the handle to your stomach, squeezing shoulder blades.',
      'Extend the arms to a controlled stretch.',
    ],
    tips: ['Keep your torso still — let the back do the work, not momentum.'] },
  { id: 'face-pull', name: 'Face Pull', group: 'Back', equip: 'Cable', mechanic: 'Isolation',
    primary: ['rearDelts'], secondary: ['traps'],
    instructions: [
      'Set a rope at face height. Pull toward your forehead.',
      'Externally rotate so your knuckles point behind you.',
      'Return slow and controlled.',
    ],
    tips: ['Great for posture and healthy shoulders — go light, high reps.'] },

  // ── LEGS ────────────────────────────────────────────────────────────────
  { id: 'back-squat', name: 'Back Squat', group: 'Legs', equip: 'Barbell', mechanic: 'Compound',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lowerBack', 'abs'],
    instructions: [
      'Bar on your upper traps, feet shoulder-width, toes slightly out.',
      'Brace, then sit down and back, knees tracking over toes.',
      'Descend to at least parallel, then drive up through mid-foot.',
    ],
    tips: ['Keep the bar over your mid-foot the whole way.', 'Big breath in at the top, brace before you descend.'] },
  { id: 'front-squat', name: 'Front Squat', group: 'Legs', equip: 'Barbell', mechanic: 'Compound',
    primary: ['quads'], secondary: ['glutes', 'abs'],
    instructions: [
      'Rack the bar across your front delts, elbows high.',
      'Squat straight down, keeping your torso upright.',
      'Drive up without letting the elbows drop.',
    ],
    tips: ['Elbows high keeps the bar from rolling forward.'] },
  { id: 'leg-press', name: 'Leg Press', group: 'Legs', equip: 'Machine', mechanic: 'Compound',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    instructions: [
      'Feet shoulder-width on the platform, back flat against the pad.',
      'Lower until knees reach ~90°, controlled.',
      'Press through the heels without locking out hard.',
    ],
    tips: ['Never let your lower back round off the pad at the bottom.'] },
  { id: 'bss', name: 'Bulgarian Split Squat', group: 'Legs', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'],
    instructions: [
      'Rear foot elevated on a bench, front foot a stride forward.',
      'Lower straight down until the front thigh is parallel.',
      'Drive up through the front heel.',
    ],
    tips: ['More forward lean hits glutes; staying upright hits quads.'] },
  { id: 'rdl', name: 'Romanian Deadlift', group: 'Legs', equip: 'Barbell', mechanic: 'Compound',
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'traps'],
    instructions: [
      'Hold the bar at your hips, soft knees.',
      'Push your hips back, sliding the bar down your thighs.',
      'Feel the hamstring stretch, then drive hips forward to stand.',
    ],
    tips: ['The bar stays close — almost dragging up your legs.'] },
  { id: 'deadlift', name: 'Conventional Deadlift', group: 'Legs', equip: 'Barbell', mechanic: 'Compound',
    primary: ['hamstrings', 'glutes', 'lowerBack'], secondary: ['quads', 'traps', 'lats'],
    instructions: [
      'Bar over mid-foot, grip just outside the knees.',
      'Drop hips, chest up, flat back, then push the floor away.',
      'Stand tall locking hips and knees together, then lower under control.',
    ],
    tips: ['Take the slack out of the bar before you pull — no jerking.'] },
  { id: 'hip-thrust', name: 'Hip Thrust', group: 'Legs', equip: 'Barbell', mechanic: 'Compound',
    primary: ['glutes'], secondary: ['hamstrings'],
    instructions: [
      'Upper back on a bench, bar across the hips.',
      'Drive through your heels to full hip extension.',
      'Squeeze the glutes at the top, lower under control.',
    ],
    tips: ['Tuck your chin and ribs down — finish with a hard glute squeeze.'] },
  { id: 'leg-ext', name: 'Leg Extension', group: 'Legs', equip: 'Machine', mechanic: 'Isolation',
    primary: ['quads'], secondary: [],
    instructions: [
      'Pad on the lower shins, knees at the seat pivot.',
      'Extend until your legs are nearly straight.',
      'Squeeze, then lower slowly.',
    ],
    tips: ['A 1-second pause at the top builds a great quad contraction.'] },
  { id: 'leg-curl', name: 'Hamstring Curl', group: 'Legs', equip: 'Machine', mechanic: 'Isolation',
    primary: ['hamstrings'], secondary: ['calves'],
    instructions: [
      'Lie or sit with the pad on your lower calves.',
      'Curl your heels toward your glutes.',
      'Control the negative all the way back.',
    ],
    tips: ['Avoid yanking — slow eccentrics are where hamstrings grow.'] },
  { id: 'walking-lunge', name: 'Walking Lunges', group: 'Legs', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    instructions: [
      'Hold dumbbells at your sides, stand tall.',
      'Step forward and lower the back knee toward the floor.',
      'Drive through the front heel into the next step.',
    ],
    tips: ['Longer steps load glutes; shorter steps load quads.'] },
  { id: 'calf-raise', name: 'Standing Calf Raise', group: 'Legs', equip: 'Machine', mechanic: 'Isolation',
    primary: ['calves'], secondary: [],
    instructions: [
      'Balls of your feet on the platform, shoulders under the pad.',
      'Rise onto your toes as high as possible.',
      'Lower into a deep stretch below the platform.',
    ],
    tips: ['Pause at the top and bottom — no bouncing.'] },

  // ── SHOULDERS ─────────────────────────────────────────────────────────────
  { id: 'ohp', name: 'Overhead Press', group: 'Shoulders', equip: 'Barbell', mechanic: 'Compound',
    primary: ['frontDelts'], secondary: ['triceps', 'sideDelts', 'abs'],
    instructions: [
      'Bar at your front delts, grip just outside shoulders.',
      'Brace your core and glutes, press straight overhead.',
      'Move your head back, then through, as the bar passes your face.',
    ],
    tips: ['Squeeze your glutes hard so you don\u2019t arch your lower back.'] },
  { id: 'db-shoulder', name: 'Dumbbell Shoulder Press', group: 'Shoulders', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['frontDelts'], secondary: ['triceps', 'sideDelts'],
    instructions: [
      'Seated, dumbbells at shoulder height, palms forward.',
      'Press up until arms are extended overhead.',
      'Lower with control back to ear level.',
    ],
    tips: ['Keep your wrists stacked over your elbows.'] },
  { id: 'lateral-raise', name: 'Lateral Raise', group: 'Shoulders', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['sideDelts'], secondary: [],
    instructions: [
      'Dumbbells at your sides, slight forward lean, soft elbows.',
      'Raise out to the sides until your arms are parallel to the floor.',
      'Lower slowly — fight gravity the whole way.',
    ],
    tips: ['Lead with the elbows and pour like emptying a jug at the top.'] },
  { id: 'rear-fly', name: 'Rear Delt Fly', group: 'Shoulders', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['rearDelts'], secondary: ['traps'],
    instructions: [
      'Hinge forward, dumbbells hanging beneath you.',
      'Raise out to the sides, squeezing the rear delts.',
      'Lower under control.',
    ],
    tips: ['Light weight, high reps — let the rear delts do the lifting.'] },

  // ── ARMS ──────────────────────────────────────────────────────────────────
  { id: 'bb-curl', name: 'Barbell Curl', group: 'Arms', equip: 'Barbell', mechanic: 'Isolation',
    primary: ['biceps'], secondary: ['forearms'],
    instructions: [
      'Stand tall, bar in a shoulder-width underhand grip.',
      'Curl up while keeping your elbows pinned at your sides.',
      'Lower all the way to a full stretch.',
    ],
    tips: ['No swinging — if your elbows drift forward, lighten the load.'] },
  { id: 'db-curl', name: 'Dumbbell Curl', group: 'Arms', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['biceps'], secondary: ['forearms'],
    instructions: [
      'A dumbbell in each hand, palms forward.',
      'Curl one or both up, squeezing the biceps.',
      'Lower slowly to full extension.',
    ],
    tips: ['Supinate (rotate the pinky up) for a stronger peak contraction.'] },
  { id: 'hammer-curl', name: 'Hammer Curl', group: 'Arms', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['biceps', 'forearms'], secondary: [],
    instructions: [
      'Dumbbells at your sides, palms facing in (neutral).',
      'Curl up keeping the neutral grip throughout.',
      'Lower under control.',
    ],
    tips: ['Targets the brachialis for thicker-looking arms.'] },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', group: 'Arms', equip: 'Cable', mechanic: 'Isolation',
    primary: ['triceps'], secondary: [],
    instructions: [
      'Rope or bar at a high pulley, elbows tucked.',
      'Push down until your arms are fully extended.',
      'Control the weight back up to ~90°.',
    ],
    tips: ['Keep your elbows glued to your sides — only the forearms move.'] },
  { id: 'oh-tricep', name: 'Overhead Tricep Extension', group: 'Arms', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['triceps'], secondary: [],
    instructions: [
      'Hold one dumbbell overhead with both hands.',
      'Lower behind your head, elbows pointing forward.',
      'Extend back to the top.',
    ],
    tips: ['The overhead stretch hits the long head of the triceps.'] },
  { id: 'chin-up', name: 'Chin-Up', group: 'Arms', equip: 'Bodyweight', mechanic: 'Compound',
    primary: ['biceps', 'lats'], secondary: ['forearms'],
    instructions: [
      'Hang from a bar with an underhand, shoulder-width grip.',
      'Pull until your chin clears the bar, elbows driving down.',
      'Lower to a full hang.',
    ],
    tips: ['The underhand grip recruits the biceps far more than a pull-up.'] },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { id: 'plank', name: 'Plank', group: 'Core', equip: 'Bodyweight', mechanic: 'Isolation',
    primary: ['abs'], secondary: ['obliques'],
    instructions: [
      'Forearms on the floor, elbows under shoulders.',
      'Form a straight line from head to heels.',
      'Brace your abs and glutes and hold.',
    ],
    tips: ['Don\u2019t let the hips sag or pike — squeeze everything.'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', group: 'Core', equip: 'Bodyweight', mechanic: 'Isolation',
    primary: ['abs'], secondary: ['obliques', 'forearms'],
    instructions: [
      'Hang from a bar, legs straight.',
      'Raise your legs to ~90° by curling your pelvis up.',
      'Lower slowly without swinging.',
    ],
    tips: ['Curl the hips up — don\u2019t just lift with the hip flexors.'] },
  { id: 'cable-crunch', name: 'Cable Crunch', group: 'Core', equip: 'Cable', mechanic: 'Isolation',
    primary: ['abs'], secondary: ['obliques'],
    instructions: [
      'Kneel below a high rope, hands by your head.',
      'Crunch down by flexing the spine, hips fixed.',
      'Return under control.',
    ],
    tips: ['Round your back down — it\u2019s a crunch, not a hip hinge.'] },

  // ── CHEST (more) ─────────────────────────────────────────────────────────
  { id: 'machine-press', name: 'Machine Chest Press', group: 'Chest', equip: 'Machine', mechanic: 'Compound',
    primary: ['chest'], secondary: ['frontDelts', 'triceps'],
    instructions: [
      'Set the seat so the handles line up with mid-chest.',
      'Press out until your arms are extended, no elbow lockout slam.',
      'Return slowly to a stretch.',
    ],
    tips: ['Great for chasing failure safely — no spotter needed.'] },
  { id: 'pec-deck', name: 'Pec Deck', group: 'Chest', equip: 'Machine', mechanic: 'Isolation',
    primary: ['chest'], secondary: ['frontDelts'],
    instructions: [
      'Forearms on the pads, elbows at shoulder height.',
      'Squeeze the pads together in front of your chest.',
      'Return to a controlled stretch.',
    ],
    tips: ['Pause and squeeze hard at the midline for a strong contraction.'] },

  // ── BACK (more) ──────────────────────────────────────────────────────────
  { id: 'tbar-row', name: 'T-Bar Row', group: 'Back', equip: 'Machine', mechanic: 'Compound',
    primary: ['lats', 'traps'], secondary: ['biceps', 'rearDelts'],
    instructions: [
      'Straddle the bar, chest on the pad if available, neutral grip.',
      'Row the handle to your stomach, driving elbows back.',
      'Lower under control to a full stretch.',
    ],
    tips: ['The chest pad takes your lower back out of it — go heavy.'] },
  { id: 'straight-arm', name: 'Straight-Arm Pulldown', group: 'Back', equip: 'Cable', mechanic: 'Isolation',
    primary: ['lats'], secondary: ['triceps'],
    instructions: [
      'Stand at a high pulley, arms straight, slight hinge.',
      'Pull the bar down to your thighs in an arc, keeping arms straight.',
      'Return overhead to a stretch.',
    ],
    tips: ['Isolates the lats without the biceps taking over.'] },
  { id: 'shrug', name: 'Barbell Shrug', group: 'Back', equip: 'Barbell', mechanic: 'Isolation',
    primary: ['traps'], secondary: [],
    instructions: [
      'Hold a bar at arm\u2019s length in front of you.',
      'Shrug your shoulders straight up toward your ears.',
      'Pause at the top, then lower under control.',
    ],
    tips: ['Don\u2019t roll the shoulders — straight up and down.'] },

  // ── LEGS (more) ──────────────────────────────────────────────────────────
  { id: 'goblet-squat', name: 'Goblet Squat', group: 'Legs', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['quads', 'glutes'], secondary: ['abs'],
    instructions: [
      'Hold one dumbbell vertically against your chest.',
      'Squat between your knees, elbows brushing the inside of your thighs.',
      'Drive up through your heels.',
    ],
    tips: ['A great way to groove squat depth and an upright torso.'] },
  { id: 'hack-squat', name: 'Hack Squat', group: 'Legs', equip: 'Machine', mechanic: 'Compound',
    primary: ['quads'], secondary: ['glutes'],
    instructions: [
      'Shoulders under the pads, feet mid-platform.',
      'Lower until your thighs are below parallel.',
      'Press up without locking the knees hard.',
    ],
    tips: ['Feet lower on the platform hits quads; higher hits glutes.'] },
  { id: 'step-up', name: 'Dumbbell Step-Up', group: 'Legs', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    instructions: [
      'Dumbbells at your sides, step onto a knee-height box.',
      'Drive through the top foot to stand tall.',
      'Lower under control and repeat.',
    ],
    tips: ['Don\u2019t push off the bottom foot — make the top leg do the work.'] },
  { id: 'glute-kickback', name: 'Cable Glute Kickback', group: 'Legs', equip: 'Cable', mechanic: 'Isolation',
    primary: ['glutes'], secondary: ['hamstrings'],
    instructions: [
      'Ankle strap on a low pulley, hinge slightly forward.',
      'Drive the working leg back and up, squeezing the glute.',
      'Return under control without swinging.',
    ],
    tips: ['Keep the motion from the hip — don\u2019t arch your lower back.'] },
  { id: 'seated-calf', name: 'Seated Calf Raise', group: 'Legs', equip: 'Machine', mechanic: 'Isolation',
    primary: ['calves'], secondary: [],
    instructions: [
      'Pads on your lower thighs, balls of feet on the platform.',
      'Raise your heels as high as possible.',
      'Lower into a deep stretch.',
    ],
    tips: ['Bent-knee position targets the soleus — go slow and high-rep.'] },

  // ── SHOULDERS (more) ──────────────────────────────────────────────────────
  { id: 'arnold-press', name: 'Arnold Press', group: 'Shoulders', equip: 'Dumbbell', mechanic: 'Compound',
    primary: ['frontDelts', 'sideDelts'], secondary: ['triceps'],
    instructions: [
      'Start with dumbbells at your chest, palms facing you.',
      'Press up while rotating your palms to face forward.',
      'Reverse the rotation on the way down.',
    ],
    tips: ['The rotation recruits front and side delts together.'] },
  { id: 'cable-lateral', name: 'Cable Lateral Raise', group: 'Shoulders', equip: 'Cable', mechanic: 'Isolation',
    primary: ['sideDelts'], secondary: [],
    instructions: [
      'Low pulley behind you, handle in the opposite hand.',
      'Raise out to the side to shoulder height.',
      'Lower slowly against the cable\u2019s constant tension.',
    ],
    tips: ['The cable keeps tension at the bottom where dumbbells lose it.'] },
  { id: 'upright-row', name: 'Upright Row', group: 'Shoulders', equip: 'Barbell', mechanic: 'Compound',
    primary: ['sideDelts', 'traps'], secondary: ['biceps'],
    instructions: [
      'Hold a bar at shoulder-width, hanging in front of you.',
      'Pull it up the body, elbows leading, to upper-chest height.',
      'Lower under control.',
    ],
    tips: ['Don\u2019t pull above the collarbone if your shoulders feel pinched.'] },
  { id: 'front-raise', name: 'Front Raise', group: 'Shoulders', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['frontDelts'], secondary: [],
    instructions: [
      'Dumbbells resting on your thighs, palms down.',
      'Raise one (or both) straight in front to shoulder height.',
      'Lower with control.',
    ],
    tips: ['Avoid swinging — if you need momentum, lighten up.'] },

  // ── ARMS (more) ───────────────────────────────────────────────────────────
  { id: 'preacher-curl', name: 'Preacher Curl', group: 'Arms', equip: 'Machine', mechanic: 'Isolation',
    primary: ['biceps'], secondary: ['forearms'],
    instructions: [
      'Upper arms flat on the pad, grip the bar or handles.',
      'Curl up, squeezing the biceps at the top.',
      'Lower all the way to a full stretch.',
    ],
    tips: ['The pad kills momentum — strict reps only, deep stretch at the bottom.'] },
  { id: 'concentration-curl', name: 'Concentration Curl', group: 'Arms', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['biceps'], secondary: [],
    instructions: [
      'Seated, elbow braced on the inside of your thigh.',
      'Curl the dumbbell up to your shoulder.',
      'Lower slowly to full extension.',
    ],
    tips: ['Bracing the elbow gives a pure, peak-building contraction.'] },
  { id: 'skull-crusher', name: 'Skull Crusher', group: 'Arms', equip: 'Barbell', mechanic: 'Isolation',
    primary: ['triceps'], secondary: [],
    instructions: [
      'Lie flat holding an EZ-bar over your forehead.',
      'Bend the elbows to lower the bar toward your hairline.',
      'Extend back to the start without flaring the elbows.',
    ],
    tips: ['Keep the upper arms still — only the forearms move.'] },
  { id: 'tricep-kickback', name: 'Dumbbell Kickback', group: 'Arms', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['triceps'], secondary: [],
    instructions: [
      'Hinge forward, upper arm parallel to the floor.',
      'Extend the elbow until the arm is straight back.',
      'Squeeze, then return under control.',
    ],
    tips: ['Lock the upper arm in place — it should never move.'] },
  { id: 'wrist-curl', name: 'Wrist Curl', group: 'Arms', equip: 'Dumbbell', mechanic: 'Isolation',
    primary: ['forearms'], secondary: [],
    instructions: [
      'Forearms on your thighs, wrists hanging over the knees, palms up.',
      'Curl the dumbbells up using only your wrists.',
      'Lower to a full stretch.',
    ],
    tips: ['Let the weight roll to your fingertips for full range.'] },

  // ── CORE (more) ───────────────────────────────────────────────────────────
  { id: 'russian-twist', name: 'Russian Twist', group: 'Core', equip: 'Bodyweight', mechanic: 'Isolation',
    primary: ['obliques'], secondary: ['abs'],
    instructions: [
      'Sit with knees bent, lean back to ~45°, feet off the floor.',
      'Rotate your torso to tap the floor on each side.',
      'Keep the movement controlled, not frantic.',
    ],
    tips: ['Rotate from the ribs, not just the arms. Add a plate to progress.'] },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', group: 'Core', equip: 'Bodyweight', mechanic: 'Isolation',
    primary: ['abs', 'obliques'], secondary: [],
    instructions: [
      'On your back, hands by your ears, legs raised.',
      'Bring opposite elbow to opposite knee, extending the other leg.',
      'Alternate sides in a smooth pedalling motion.',
    ],
    tips: ['Slow it down — a paused twist beats fast, sloppy reps.'] },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', group: 'Core', equip: 'Bodyweight', mechanic: 'Isolation',
    primary: ['abs'], secondary: ['lats', 'lowerBack'],
    instructions: [
      'Kneel holding the wheel under your shoulders.',
      'Roll forward as far as you can keep a braced, flat back.',
      'Pull yourself back in with your abs.',
    ],
    tips: ['Brace like you\u2019re about to be punched — never let the back arch.'] },
  { id: 'pallof-press', name: 'Pallof Press', group: 'Core', equip: 'Cable', mechanic: 'Isolation',
    primary: ['obliques', 'abs'], secondary: [],
    instructions: [
      'Stand side-on to a cable at chest height, hands at your sternum.',
      'Press the handle straight out and resist the rotation.',
      'Return to your chest, staying square.',
    ],
    tips: ['An anti-rotation drill — the goal is to NOT twist.'] },
];

// Quick lookup by name (resolves coach plan_data exercise names → library entry)
window.exerciseByName = function (name) {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  return window.EXERCISE_DB.find(e => e.name.toLowerCase() === n) || null;
};
window.exerciseById = function (id) {
  return window.EXERCISE_DB.find(e => e.id === id) || null;
};
