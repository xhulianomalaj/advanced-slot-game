import { Container, Sprite } from "pixi.js";
import { Application } from "pixi.js";

export class WelcomeScene extends Container {
    game!: Application;
    static assetBundles?: string[] = [];

    async create(): Promise<void> {
    }
    onLoad(progress: number) {
    }
}