import Phaser from "phaser";
import Cookies from "js-cookie"
import { Player } from "./player";
import { io } from "socket.io-client"

import mapTilesImage from "../assets/maps/town/map_tiles.png"
import mapJson from "../assets/maps/town/map.json"
import characterBase from "../assets/characters/base.png"

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export class GameScene extends Phaser.Scene {
  static TILE_SIZE = 32;

  constructor() {
    super();

    this.mainPlayer = undefined;
    this.chosenMap = undefined;
  }

  getChosenMap() {
    return this.chosenMap;
  }

  setChosenMap() {
    this.chosenMap = this.chosenMap;
  }

  getMainPlayer() {
    return this.mainPlayer;
  }

  setMainPlayer(mainPlayer) {
    this.mainPlayer = mainPlayer;
  }

  showLoadingScene() {
    var progressBar = this.add.graphics();
    var progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        fill: "#ffffff",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    var percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: "0%",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    var assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "18px monospace",
        fill: "#ffffff",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    this.load.on("progress", function (value) {
      percentText.setText(parseInt(value * 90) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 270 * value, 30);
    });

    this.load.on("fileprogress", function (file) {
      assetText.setText("Loading asset: " + file.key);
    });

    this.load.on("complete", function () {
      assetText.setText("Connecting to websocket");
    });

    this.progressBar = progressBar;
    this.progressBox = progressBox;
    this.loadingText = loadingText;
    this.percentText = percentText;
    this.assetText = assetText;
  }

  closeLoadingScene() {
    this.progressBar.destroy();
    this.progressBox.destroy();
    this.loadingText.destroy();
    this.percentText.destroy();
    this.assetText.destroy();
  }

  preload() {
    this.showLoadingScene();

    this.load.image("map-tiles", mapTilesImage);
    this.load.tilemapTiledJSON("map", mapJson);
    this.load.spritesheet("player", characterBase, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    const socket = io("http://localhost:5000", {
      auth: (cb) => {
        cb({ 
          token: Cookies.get("1337token"),
          connection_source: "game"
        });
      },
    });

    socket.on("connect", () => {
      console.log("connected ...");
      if (this.percentText.displayList !== null)
        this.percentText.setText("95%")
      
      if (this.progressBar.displayList !== null) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(250, 280, 285, 30);
      }

      if (this.assetText.displayList !== null)
        this.assetText.setText("Getting user data");
    })

    socket.on("handle_action", (data) => {
      if (this.getMainPlayer() !== undefined) {
        this.getMainPlayer().setPosition(parseInt(data["position"]));
      }
    })

    socket.on("user_data", (data) => {
      if (data["user_datas"].length === 0) {
        socket.disconnect();
        socket.connect();
      } else {
        this.percentText.setText("100%")
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(250, 280, 300, 30); 
        this.assetText.setText("Iniating the map");
        this.closeLoadingScene();

        const map = this.make.tilemap({
          key: "map",
        });
        const tileset = map.addTilesetImage("tiles", "map-tiles");
        const layer = map.createLayer("layer", tileset, 0, 0);
        layer.setDepth(0);

        const playerSprite = this.add.sprite(0, 0, "player");
        playerSprite.setDepth(2);

        this.anims.create({
          key: "walk-up",
          frames: this.anims.generateFrameNumbers("player", {
            frames: Array.from({ length: 9 }, (_, i) => i + 104),
          }),
          frameRate: 10,
          repeat: -1,
        });
        this.anims.create({
          key: "walk-down",
          frames: this.anims.generateFrameNumbers("player", {
            frames: Array.from({ length: 9 }, (_, i) => i + 117),
          }),
          frameRate: 10,
          repeat: -1,
        });
        this.anims.create({
          key: "walk-left",
          frames: this.anims.generateFrameNumbers("player", {
            frames: Array.from({ length: 9 }, (_, i) => i + 130),
          }),
          frameRate: 10,
          repeat: -1,
        });
        this.anims.create({
          key: "walk-right",
          frames: this.anims.generateFrameNumbers("player", {
            frames: Array.from({ length: 9 }, (_, i) => i + 143),
          }),
          frameRate: 10,
          repeat: -1,
        });

        this.cameras.main.setBounds(
          0,
          0,
          (mapJson["width"]) * GameScene.TILE_SIZE,
          (mapJson["height"] + 1) * GameScene.TILE_SIZE
        );
        this.cameras.main.startFollow(playerSprite);
        this.cameras.main.roundPixels = true;
        
        this.setMainPlayer(
          new Player(
            playerSprite,
            data["user_datas"]["position"],
            new Phaser.Math.Vector2(mapJson["width"], mapJson["height"])
          )
        );
      }
    });
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
    mode: Phaser.Scale.ENVELOP,
  },
  parent: "game",
  backgroundColor: "#152342"
};

export const game = new Phaser.Game(config);
