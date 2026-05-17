// ═══════════════════════════════════════════════
// Gary's Life — Story System
// Lucky Lake quest state machine, XP, dialogue
// ═══════════════════════════════════════════════

export const STORY_PHASES = {
  LOCKED:      'locked',
  BOUGHT:      'bought',
  WALKING:     'walking',
  SHED_FOUND:  'shed_found',
  RIDING:      'riding',
  ASSEMBLING:  'assembling',
  COMPLETE:    'complete'
};

// Dialogue lines triggered by Z position on the trail (player moves in -Z direction)
export const TRAIL_DIALOGUE = [
  { z:   0, text: "Come on Bunny. It's not that far." },
  { z: -20, text: "I know, I know — I forgot the ammo. We're not hunting today. Just walking." },
  { z: -40, text: "Mr. Crane said Lucky Lake is just past the old fence line. 'Everything works out there,' he told me." },
  { z: -58, text: "How'd you even get shot, huh? You were just in the backyard." },
  { z: -76, text: "I'm sorry I didn't find out who did it. Dad would've known what to do." },
  { z: -95, text: "Bunny... I think this is it. This is where the lake's supposed to be." },
  { z:-112, text: "There's no lake. Of course there's no lake. Come on, let's go home." },
  { z:-124, text: "...Wait. What's that over there?" },
];

// XP flash messages at thresholds
export const XP_FLASHES = [
  { xp:  30, text: "You study the trigger guard. Something about it feels familiar..." },
  { xp:  50, text: "The barrel slides into place with a click. Someone machined this perfectly." },
  { xp:  75, text: "It's almost there. Whatever this is, it was built by someone extraordinary." },
  { xp: 100, text: null } // null = triggers full reveal cutscene
];

export const GRANDPA_REVEAL_TEXT = [
  "You dip a rag in water from your canteen.",
  "You wipe the dust off the receiver — slowly.",
  "Under the grime: an engraved brass plate.",
  "A name.",
  "Your great-grandfather's name.",
  "He disappeared when he was sixteen.",
  "Nobody in the family ever found out what happened.",
  "This gun has been sitting in that shed ever since.",
  "It's yours now."
];

export class Story {
  constructor() {
    this.phase       = STORY_PHASES.LOCKED;
    this.xp          = 0;
    this.xpNeeded    = 100;
    this.firedFlashes = new Set(); // which XP thresholds already shown
    this.dialogueFired = new Set(); // which trail dialogue lines already shown
  }

  // ─── Serialization ───────────────────────────

  serialize() {
    return {
      phase:        this.phase,
      xp:           this.xp,
      firedFlashes: [...this.firedFlashes],
      dialogueFired: [...this.dialogueFired]
    };
  }

  deserialize(data) {
    if (!data) return;
    this.phase        = data.phase        || STORY_PHASES.LOCKED;
    this.xp           = data.xp           || 0;
    this.firedFlashes = new Set(data.firedFlashes  || []);
    this.dialogueFired = new Set(data.dialogueFired || []);
  }

  // ─── Phase helpers ────────────────────────────

  getPhase()   { return this.phase; }
  isLocked()   { return this.phase === STORY_PHASES.LOCKED; }
  isComplete()  { return this.phase === STORY_PHASES.COMPLETE; }
  gunUnlocked() { return this.phase === STORY_PHASES.COMPLETE; }

  buyQuest() {
    if (this.phase !== STORY_PHASES.LOCKED) return false;
    this.phase = STORY_PHASES.BOUGHT;
    return true;
  }

  startWalking() {
    if (this.phase === STORY_PHASES.BOUGHT || this.phase === STORY_PHASES.WALKING) {
      this.phase = STORY_PHASES.WALKING;
      return true;
    }
    return false;
  }

  shedFound() {
    this.phase = STORY_PHASES.SHED_FOUND;
  }

  startRiding() {
    this.phase = STORY_PHASES.RIDING;
  }

  startAssembling() {
    this.phase = STORY_PHASES.ASSEMBLING;
    // grant initial XP for shed interactions
  }

  completeQuest() {
    this.phase = STORY_PHASES.COMPLETE;
    this.xp = this.xpNeeded;
  }

  // ─── XP System ───────────────────────────────

  addXP(amount) {
    if (this.phase !== STORY_PHASES.ASSEMBLING) return null;
    this.xp = Math.min(this.xp + amount, this.xpNeeded);

    // Check for flash thresholds
    for (const flash of XP_FLASHES) {
      if (this.xp >= flash.xp && !this.firedFlashes.has(flash.xp)) {
        this.firedFlashes.add(flash.xp);
        if (flash.xp >= this.xpNeeded) {
          this.completeQuest();
        }
        return flash; // caller handles display
      }
    }
    return null;
  }

  getXPFraction() {
    return Math.min(this.xp / this.xpNeeded, 1);
  }

  // ─── Trail Dialogue ───────────────────────────

  /**
   * Given current Z position on trail, returns the next unplayed
   * dialogue line if the player has reached its trigger point.
   */
  checkDialogue(playerZ) {
    for (const line of TRAIL_DIALOGUE) {
      if (!this.dialogueFired.has(line.z) && playerZ <= line.z) {
        this.dialogueFired.add(line.z);
        return line.text;
      }
    }
    return null;
  }
}
