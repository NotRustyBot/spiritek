import { Application, Assets } from 'pixi.js';
import './style.less'
import { Game } from './game';
import bundle from './bundle';
import bundle_sound from './bundle_sound';
import { Howl } from "howler"


async function main() {
    const app = new Application();
    await app.init({ background: '#101418', resizeTo: window });
    //await app.init({ background: '#ffffff', resizeTo: window });
    Assets.init({ manifest: { bundles: [bundle as any] } });


    bundle_sound.assets.forEach((asset) => {
        new Howl({ src: asset.src, preload: true });
    });

    await Assets.loadBundle("bundle");
    document.body.appendChild(app.canvas);
    const game = new Game(app);
    game.init();
}

main();
