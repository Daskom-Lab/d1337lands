import { GameScene } from "./index";

export class Player {
  constructor(sprite, tilePos) {
    const offsetX = GameScene.TILE_SIZE / 2;
    const offsetY = GameScene.TILE_SIZE;

    this.sprite = sprite;
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setPosition(
      tilePos.x * GameScene.TILE_SIZE + offsetX,
      tilePos.y * GameScene.TILE_SIZE + offsetY
    );
    this.sprite.setFrame(104);
  }

  getPosition() {
    return this.sprite.getBottomCenter();
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