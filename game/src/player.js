import { GameScene } from "./index";

export class Player {
  constructor(sprite, tilePos, mapSize) {
    this.tilePos = tilePos;
    this.mapSize = mapSize;
    this.sprite = sprite;

    this.sprite.setFrame(104);
    this.sprite.setOrigin(0.5, 1);
    this.setPosition(tilePos);
  }

  setPlayerAnimation(key) {
    this.sprite.anims.create({
      key: "walk-up",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 104),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.sprite.anims.create({
      key: "walk-down",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 117),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.sprite.anims.create({
      key: "walk-left",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 130),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.sprite.anims.create({
      key: "walk-right",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 143),
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  getPosition() {
    return this.sprite.getBottomCenter();
  }

  getMapSize() {
    return this.mapSize;
  }

  setMapSize(mapSize) {
    this.mapSize = mapSize;
  }

  setPosition(position) {
    const offsetX = GameScene.TILE_SIZE / 2;
    const offsetY = GameScene.TILE_SIZE;

    let position_x = Math.floor(position % this.mapSize.x) * GameScene.TILE_SIZE + offsetX
    let position_y = Math.floor(position / this.mapSize.x) * GameScene.TILE_SIZE + offsetY

    this.sprite.setPosition(position_x, position_y);
  }

  stopAnimation() {
    if (this.sprite.anims.currentAnim) {
      const standingFrame = this.sprite.anims.currentAnim.frames[0].frame.name;
      this.sprite.anims.stop();
      this.sprite.setFrame(standingFrame);
    }
  }

  startAnimation(direction) {
    this.sprite.anims.play(direction);
  }
}