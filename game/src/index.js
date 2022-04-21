import Phaser from "phaser";
import { Player } from "./player";
import mapTilesImage from "./assets/map_tiles.png"
import mapJson from "./assets/map.json"
import characterBase from "./assets/characters/base.png"

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export class GameScene extends Phaser.Scene {
  static TILE_SIZE = 32;

  constructor() {
    super();
  }

  preload() {
    this.load.image("map-tiles", mapTilesImage);
    this.load.tilemapTiledJSON("map", mapJson);
    this.load.spritesheet("player", characterBase, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    const map = this.make.tilemap({
      key: "map"
    });
    const tileset = map.addTilesetImage("tiles", "map-tiles");
    const layer = map.createLayer("layer", tileset, 0, 0);
    layer.setDepth(0);

    const playerSprite = this.add.sprite(0, 0, "player");
    playerSprite.setDepth(2);

    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("player", {
        frames: Array.from({length: 9}, (_, i) => i + 104),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("player", {
        frames: Array.from({length: 9}, (_, i) => i + 117),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("player", {
        frames: Array.from({length: 9}, (_, i) => i + 130),
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("player", {
        frames: Array.from({length: 9}, (_, i) => i + 143),
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.cameras.main.startFollow(playerSprite);
    this.cameras.main.roundPixels = true;

    const player = new Player(playerSprite, new Phaser.Math.Vector2(25, 50));
  }
}

const config = {
  title: "D1337Lands Codeventure",
  render: {
    antialias: false,
  },
  type: Phaser.AUTO,
  pixelArt: true,
  scene: GameScene,
  scale: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.FIT
  },
  parent: "game",
  backgroundColor: "#152342"
};

export const game = new Phaser.Game(config);
