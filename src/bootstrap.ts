import '@esotericsoftware/spine-pixi-v8';
import { Application, Assets, extensions, ResizePlugin as PixiResizePlugin } from 'pixi.js';
import {
  ApplicationRegistry,
  CorePlugin,
  LocalizationPlugin,
  ResizePlugin,
  GameObjectFactory,
  AudioPlugin,
  NavigationPlugin,
  AnimationPlugin,
  Logger,
} from '@dreams-engine/engine';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { SlotPlugin } from '@dreams-engine/slot';
import { WelcomeScene } from './scenes/Welcome';
import { MainScene } from './scenes/Main';

// Register GSAP plugin once per module load
if (!(gsap.plugins as any)?.PixiPlugin) {
  gsap.registerPlugin(PixiPlugin);
}

// Ensure we are using the engine's resize plugin instead of Pixi's default implementation
try {
  extensions.remove(PixiResizePlugin);
} catch (err) {
  Logger?.debug?.('[test-game] resize plugin removal skipped', err);
}
extensions.add(ResizePlugin);
extensions.add(CorePlugin, LocalizationPlugin, GameObjectFactory, AudioPlugin, AnimationPlugin, NavigationPlugin, SlotPlugin);

type TestGameBootstrapInput = {
  payload?: {
    operator?: { key: string; title: string };
    provider?: { id: string; name: string; gameId: string; currency?: string; language?: string };
  };
  init?: any | null;
  signal: AbortSignal;
};

const DEFAULT_APP_OPTIONS = {
  background: '#000000',
  debug: { pixiExtension: true, log: false },
  resizeOpts: {
    landscape: { width: 1920, height: 1080, scaleMode: 'ENVELOP', align: 0.5 },
    portrait: { width: 1080, height: 1920, scaleMode: 'ENVELOP', align: 0.5 },
    debounceDelay: 150,
  },
  resolution: 2,
  antialias: true,
  localization: { lng: 'en', fallbackLng: 'en', langPath: 'preload/language' },
  animations: [
    { type: 'spine', name: 'idle', def: { anim: '' } },
    { type: 'spine', name: 'win', def: { anim: 'animation' } },
  ],
} as Record<string, unknown>;

function mergeOptions(base: Record<string, unknown>, override?: Record<string, unknown>) {
  if (!override) return { ...base };
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = result[key];
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      existing && typeof existing === 'object' && !Array.isArray(existing)
    ) {
      result[key] = { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function ensureAssetsReady() {
  try {
    await Assets.init({ manifest: 'manifest.json', basePath: import.meta.env.VITE_ASSETS_BASE_PATH || '/assets' });
    await Assets.loadBundle('preload');
  } catch (err: any) {
    // Ignore if already initialised; Pixi throws when manifest is set twice
    if (typeof err?.message === 'string' && err.message.includes('manifest has already been set')) {
      return;
    }
    Logger?.warn?.('[test-game] asset init warning', err);
  }
}

export default async function createPixiGame({ payload, init, signal }: TestGameBootstrapInput): Promise<Application | void> {
  if (signal.aborted) return;

  const operatorId = payload?.operator?.key ?? 'test-game';
  // Clean up any previous instance under the same id to avoid duplicate registrations
  try {
    ApplicationRegistry.destroyApp(operatorId);
  } catch (err) {
    Logger?.debug?.('[test-game] destroy existing app skipped', err);
  }

  await ensureAssetsReady();
  if (signal.aborted) return;

  const app = new Application();
  const initOptions = mergeOptions(DEFAULT_APP_OPTIONS, {
    localization: {
      ...(DEFAULT_APP_OPTIONS.localization || {}),
      lng: payload?.provider?.language || 'en',
    },
    slot: {
      currency: payload?.provider?.currency || 'EUR',
    }
  });

  try {
    ApplicationRegistry.addApp(operatorId, app);
  } catch (err) {
    Logger?.warn?.('[test-game] addApp failed', err);
  }

  await app.init(initOptions as any);
  if (signal.aborted) {
    app.destroy();
    return;
  }

  try {
    await app.lang?.init?.();
  } catch (err) {
    Logger?.warn?.('[test-game] localization init failed', err);
  }

  try {
    await app.animations?.ready?.();
  } catch (err) {
    Logger?.warn?.('[test-game] animation init failed', err);
  }

  if (signal.aborted) {
    ApplicationRegistry.destroyApp(operatorId);
    return;
  }

  setTimeout(async () => {
    app.registry.set('initData', init ?? {});
    await app.navigation.showScreen(WelcomeScene);
    await app.navigation.showScreen(MainScene);
  }, 0);

  return Promise.resolve(app);
}
