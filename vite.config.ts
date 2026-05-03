import { defineConfig, loadEnv, type ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { bootConfigPlugin } from './vite-plugin-boot-config';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // ESM-safe __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  let assetpackPlugin: any = null;
  try {
    const mod = await import(/* @vite-ignore */ '@dreams-engine/common/scripts/asset-pack-vite-plugin');
    const pixi = await import(/* @vite-ignore */ '@assetpack/core/pixi');
    assetpackPlugin = mod.default ? mod.default({
      entry: resolve(__dirname, 'raw-assets'),
      output: resolve(__dirname, 'public/assets'),
      pipes: [
        pixi.pixiPipes({
          cacheBust: false,
          resolutions: { default: 1 },
          compression: { jpg: true, png: true, webp: false },
          texturePacker: { texturePacker: { nameStyle: 'short' } },
          audio: {},
          manifest: {
            createShortcuts: true,
            trimExtensions: true,
            includeMetaData: false,
            nameStyle: 'short',
            output: 'public/assets/manifest.json',
          },
        })
      ],
    }) : null;
  } catch { }

  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'SlotEngineSlotGame',
        fileName: 'slot-engine-slot-game',
      }
    },
    plugins: [
      bootConfigPlugin(env),
      assetpackPlugin,
      {
        name: 'dev-game-path-rewrite',
        configureServer(server: ViteDevServer) {
          server.middlewares.use((req: IncomingMessage, _res: ServerResponse, next: () => void) => {
            // The launcher fetches: gamesBaseUrl/gameId/public/* in dev mode.
            // Rewrite that prefix back to Vite's public root.
            if (req.url?.startsWith('/slot-game/public/')) {
              req.url = req.url.replace('/slot-game/public/', '/');
            }
            next();
          });
        },
      },
    ].filter(Boolean),
    server: {
      port: 8081,
      cors: true,
    },
  }
});
