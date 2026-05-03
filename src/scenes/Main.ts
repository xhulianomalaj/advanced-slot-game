import { Application, BlurFilter, Container, Assets, Texture } from "pixi.js";
import {
  AnticipationManager,
  BehaviorConfig,
  MachineOptions,
} from "@dreams-engine/slot";
import { BackgroundScene } from "./Background";

// Spin behavior presets — easy A/B testing of feel.
// Pick by index in `SPIN_PRESET` below.
const spinPresets: BehaviorConfig[] = [
  // 0: standard (default)
  {
    type: "standard",
    options: {
      executeOpts: {
        stepDuration: 0.08,
        easeInDuration: 0.6,
        easeInType: "back.in(3)",
      },
      stopOpts: {
        stopDuration: 0.55,
        stopEase: "back.out(4)",
        forceStopDuration: 0.1,
        forceStopSpeed: 10,
      },
    },
  },
  // 1: strip — continuous-strip feel
  {
    type: "strip",
    options: {
      executeOpts: {
        easeInType: "back.in(1.25)",
        easeInDuration: 0.65,
        duration: 0.2,
        speed: 1,
      },
      stopOpts: {
        stopEase: "back.out(1.25)",
        stopDuration: 1.6,
        pendingRepeats: 2,
        forceStopDuration: 0.1,
        forceStopSpeed: 8,
        speed: 1,
      },
    },
  },
  // 2: fall — symbols drop into place
  {
    type: "fall",
    options: {
      executeOpts: {
        clearEase: "power2.in",
        clearDuration: 0.2,
        stagger: 0.05,
        speed: 1,
      },
      stopOpts: {
        stopEase: "back.out(1.7)",
        stopDuration: 0.35,
        stagger: 0.1,
        forceStopDuration: 0.05,
        forceStopSpeed: 8,
        speed: 1,
      },
    },
  },
];
const SPIN_PRESET = 1;

export class MainScene extends Container {
  game!: Application;
  static assetBundles?: string[] = ["main"];

  async create(): Promise<void> {
    // set background scene
    this.game.navigation.setBackground(BackgroundScene);
    // create parent slot container
    const slotMachineContainer = this.game.create.container(
      { label: "slot-machine-container", x: 410, y: 160, scale: 0.9 },
      this,
    );
    this.game.create.sprite(
      {
        texture: Texture.from("reel-frame.png"),
        x: -62,
        y: -46,
        scale: { x: 1, y: 1.01 },
      },
      slotMachineContainer,
    );
    // create slot machine config and instance
    const initData = this.game.registry.get("initData");
    const machineOptions: MachineOptions = {
      visibleCount: 4,
      extraCount: 1,
      cellWidth: 238,
      cellHeight: 190,
      symbolConfig: Assets.get("symbol-def"),
      useMask: false,
      useMachineMask: true,
      spinBehavior: spinPresets[SPIN_PRESET],
      layout: {
        type: "auto",
        align: "horizontal",
        spacing: 0,
      },
      reels: [
        {
          count: 5,
          spacig: 0,
          direction: "down",
          alwaysShowFilters: true,
        },
      ],
      initialSymbols: initData.visibleSymbols || [],
      startSequence: {
        delay: 0.25,
      },
      stopSequence: {
        delay: 0.5,
      },
    };
    const slotMachine = this.game.slot.createMachine(machineOptions);
    slotMachine.setMaskPos(13, -6);
    slotMachineContainer.addChild(slotMachine.container);

    // motion blur on each reel — vertical only, sells the spin speed
    const motionBlur = new BlurFilter({ strengthX: 0, strengthY: 12 });
    slotMachine.reels.forEach((r) => r.applyFilter(motionBlur));

    // anticipation: when 2+ scatters land, slow remaining reels for tension
    const anticipation = new AnticipationManager(slotMachine, {
      symbolId: "17", // scatter
      minCount: 2,
      maxCount: 3,
      countMode: "reel",
      speedFactor: 0.5,
      anticipationRepeats: 6,
      cancelStagger: 0.25,
    });
    anticipation.events.on("anticipationstarted", (r) =>
      console.log("anticipation started", r.id),
    );
    anticipation.events.on("anticipationstopped", (r) =>
      console.log("anticipation stopped", r.id),
    );

    // inform game ui that game is ready
    this.game.slot.emitEvent("game:ready");

    this.game.events.on("game:betchange", (p) => {
      console.log("bet changed", p);
    });
    this.game.events.on("game:speedchange", (p) => {
      console.log("speed changed", p);
    });
    this.game.events.on("game:forcestop", () => {
      console.log("force stop");
    });
    this.game.events.on("game:togglesoundfx", (p) => {
      console.log("toggle sound fx", p);
    });
    this.game.events.on("game:togglemusic", (p) => {
      console.log("toggle music", p);
    });
    this.game.events.on("game:togglebatterysave", (p) => {
      console.log("toggle battery save", p);
    });
    this.game.events.on("game:spinning", (p) => {
      console.log("spinning triggered", p);
    });
    this.game.events.on("game:balancechange", (p) => {
      console.log("balance changed", p);
    });
    this.game.events.on("game:autoplaychange", (p) => {
      console.log("autoplay changed", p);
    });
    this.game.events.on("game:bigwin", (p) => {
      console.log("play big win animation", p);
      setTimeout(() => {
        console.log("big win animation complete");
        this.game.slot.emitEvent("game:bigwincomplete");
      }, 500);
    });
    this.game.events.on("game:fsintro", (p) => {
      console.log("free spins intro", p);
      setTimeout(() => {
        console.log("free spins intro complete");
        this.game.slot.emitEvent("game:fsintrocomplete");
      }, 500);
    });
    this.game.events.on("game:fsoutro", (p) => {
      console.log("free spins outro", p);
      setTimeout(() => {
        console.log("free spins outro complete");
        this.game.slot.emitEvent("game:fsoutrocomplete");
      }, 500);
    });
  }
}
