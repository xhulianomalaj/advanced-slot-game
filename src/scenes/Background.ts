
import { Container } from "pixi.js";
import { Application } from "pixi.js";

export class BackgroundScene extends Container {
    game!: Application;

    async create(): Promise<void> {
        this.game.create.sprite({
            src: 'normal-bg'
        }, this);

        // add left fire pot
        const leftPot = this.game.create.spine({
            x: 272,
            y: 965,
            atlas: 'fire pot.atlas',
            skeleton: 'fire pot.json'
        }, this);
        leftPot.scale.set(0.18);
        leftPot.state.setAnimation(0, 'animation', true);

        // add right fire pot
        const rightPot = this.game.create.spine({
            x: 1650,
            y: 965,
            atlas: 'fire pot.atlas',
            skeleton: 'fire pot.json'
        }, this);
        rightPot.scale.set(0.18);
        rightPot.state.setAnimation(0, 'animation', true);
    }
}