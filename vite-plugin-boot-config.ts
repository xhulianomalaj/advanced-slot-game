import { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export function bootConfigPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'boot-config-generator',
    configResolved(config) {
      const modulePath = env.VITE_MODULE_PATH || '';
      const gameName = env.VITE_GAME_NAME || 'No Game Display Name';

      const templatePath = resolve(config.root, 'public/boot-config.template.json');
      const outputPath = resolve(config.root, 'public/boot-config.json');

      try {
        const template = readFileSync(templatePath, 'utf-8');
        const content = template
          .replace(/__MODULE_PATH__/g, modulePath)
          .replace(/__GAME_NAME__/g, gameName);
        writeFileSync(outputPath, content);
        console.log(`✓ Generated boot-config.json for ${config.mode} mode`);
      } catch (error) {
        console.warn('Could not generate boot-config.json:', error);
      }
    }
  };
}
