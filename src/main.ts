import { Application, Assets } from 'pixi.js';
import './style.css'
import { Game } from './game';
import bundle from './bundle';


async function main() {
    const app = new Application();
    await app.init({ background: '#101418', resizeTo: window });
    //await app.init({ background: '#ffffff', resizeTo: window });
    Assets.init({ manifest: { bundles: [bundle as any] } });
    await Assets.loadBundle("bundle");
    document.body.appendChild(app.canvas);
    const game = new Game(app);
    game.init();
}

main();
