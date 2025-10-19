import bundle_sound, { Bundle_soundAliases } from "./bundle_sound";

export class AudioManager {
    currentMusic?: Howl;
    musicVolume = 1;
    music(music: Bundle_soundAliases, loop = true) {
        this.currentMusic?.fade(this.musicVolume, 0, 1000);
        const newMusic = new Howl({ src: Array.from(bundle_sound.assets).find(f => f.alias == music)!.src });
        newMusic.fade(0, this.musicVolume, 1000);
        newMusic.play();
        newMusic.loop(loop);
        this.currentMusic = newMusic;
        return newMusic;
    }
}