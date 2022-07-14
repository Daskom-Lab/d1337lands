import { GameScene } from "./index";

export class Player {
  constructor(sprite, tilePos, mapSize) {
    this.tilePos = tilePos;
    this.mapSize = mapSize;
    this.sprite = sprite;
    this.lastposition = tilePos;
    this.lastdirection = "";

    this.futurepositions = [];
    this.runAnimations = false;

    this.sprite.setFrame(104);
    this.sprite.setOrigin(0.5, 1);
    this.setPosition(tilePos);
  }

  destroy() {
    if (this.sprite !== undefined) this.sprite.destroy();
  }

  setSprite(sprite) {
    if (this.sprite !== undefined) this.sprite.destroy();

    this.sprite = sprite;
    this.sprite.setFrame(104);
    this.sprite.setOrigin(0.5, 1);
  }

  setPlayerAnimation(key) {
    this.sprite.anims.create({
      key: "walk-up",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 104),
      }),
      frameRate: 15,
      repeat: -1,
    });
    this.sprite.anims.create({
      key: "walk-left",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 117),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.sprite.anims.create({
      key: "walk-down",
      frames: this.sprite.anims.generateFrameNumbers(key, {
        frames: Array.from({ length: 9 }, (_, i) => i + 130),
      }),
      frameRate: 15,
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
    return this.lastposition;
  }

  getMapSize() {
    return this.mapSize;
  }

  setMapSize(mapSize) {
    this.mapSize = mapSize;
  }

  sleep = ms => new Promise(r => setTimeout(r, ms));

  setPosition(future_position, future_direction = undefined) {
    const offsetX = GameScene.TILE_SIZE / 2;
    const offsetY = GameScene.TILE_SIZE;

    this.futurepositions.push({
      position: future_position,
      direction: future_direction
    });

    let position_x = Math.floor(future_position % this.mapSize.x) * GameScene.TILE_SIZE + offsetX;
    let position_y = Math.floor(future_position / this.mapSize.x) * GameScene.TILE_SIZE + offsetY;

    if (future_direction) {
      if (!this.runAnimations) {
        this.runAnimations = true;

        (async () => {
          do {
            let currentpositions = this.futurepositions.shift();

            if (this.getPosition() !== currentpositions.position) {
              if (this.lastdirection !== currentpositions.direction || !this.sprite.anims.currentAnim) {
                this.lastdirection = currentpositions.direction
                this.startAnimation(`walk-${currentpositions.direction}`);
              }

              const last_position_x = Math.floor(this.getPosition() % this.mapSize.x) * GameScene.TILE_SIZE + offsetX;
              const last_position_y = Math.floor(this.getPosition() / this.mapSize.x) * GameScene.TILE_SIZE + offsetY;

              position_x = Math.floor(currentpositions.position % this.mapSize.x) * GameScene.TILE_SIZE + offsetX;
              position_y = Math.floor(currentpositions.position / this.mapSize.x) * GameScene.TILE_SIZE + offsetY;

              const is_moving_vertically = last_position_y !== position_y
              const position_differences = is_moving_vertically ?
                (position_y - last_position_y) / 50 :
                (position_x - last_position_x) / 50

              let changing_position = is_moving_vertically ? last_position_y : last_position_x;
              for (let i = 0; i < 50; i++) {
                if (this.runAnimations) {
                  changing_position += position_differences;
                  this.sprite.setPosition(
                    is_moving_vertically ? position_x : changing_position,
                    is_moving_vertically ? changing_position : position_y
                  );
                  await this.sleep(5);
                } else return;
              }
            }

            this.lastposition = currentpositions.position;
          } while (this.futurepositions.length > 0);

          this.stopAnimation();
          this.runAnimations = false;
        })();
      }

      return;
    }

    this.runAnimations = false;
    this.futurepositions = [];
    this.sprite.setPosition(position_x, position_y);
    this.stopAnimation();

    this.lastposition = future_position;
  }

  stopAnimation() {
    if (this.sprite.anims.currentAnim) {
      const standingFrame = this.sprite.anims.currentAnim.frames[0].frame.name;
      this.sprite.anims.stop();
      this.sprite.setFrame(standingFrame);
      this.sprite.anims.currentAnim = undefined;
    }
  }

  startAnimation(direction) {
    this.sprite.anims.play(direction);
  }
}