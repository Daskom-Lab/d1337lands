import { GameScene } from "./index";

export class Player {
  constructor(sprite, tilePos, mapSize) {
    const offsetX = GameScene.TILE_SIZE / 2;
    const offsetY = GameScene.TILE_SIZE;

    let position_x = Math.floor(tilePos % mapSize.x) * GameScene.TILE_SIZE + offsetX
    let position_y = Math.floor(tilePos / mapSize.x) * GameScene.TILE_SIZE + offsetY

    this.tilePos = tilePos;
    this.mapSize = mapSize;
    this.sprite = sprite;
    this.sprite.setFrame(104);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setPosition(position_x, position_y);
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
    this.sprite.setPosition(position.x, position.y);
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