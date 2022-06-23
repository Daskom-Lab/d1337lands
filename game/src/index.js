import Phaser from "phaser";
import Cookies from "js-cookie"
import { Player } from "./player";
import { io } from "socket.io-client"

import townGroundTiles from "../assets/maps/town/ground_tiles.png"
import townStuffTiles from "../assets/maps/town/stuff_tiles.png"
import townJson from "../assets/maps/town/town.json"

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

  setMainPlayerPosition(position) {
    if (this.getMainPlayer() !== undefined) {
      this.getMainPlayer().setPosition(position);
    }
  }

  isEmptyObject(object) {
    for (var _ in object) return false;
    return true;
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

    this.load.image("town-ground-tiles", townGroundTiles);
    this.load.image("town-stuff-tiles", townStuffTiles);
    this.load.tilemapTiledJSON("town", townJson);

    this.load.spritesheet("base-character", characterBase, {
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
      if (data.action === "move") {
        this.setMainPlayerPosition(parseInt(data.position))
      }
    })

    socket.on("user_data", (data) => {
      if (this.isEmptyObject(data.user_datas)) {
        socket.disconnect();
        socket.connect();
      } else {
        this.percentText.setText("100%")
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(250, 280, 300, 30); 
        this.assetText.setText("Iniating the map");
        this.closeLoadingScene();

        const town = this.make.tilemap({
          key: "town",
        });

        //TODO: Need to make changes on the map layering (between ground and stuff)
        ///     due to bad depth sorting caused by the character that occupy 2 blocks instead of 1

        const townGroundTileset = town.addTilesetImage("ground_tiles", "town-ground-tiles");
        const townGroundLayer = town.createLayer("ground", townGroundTileset, 0, 0);
        townGroundLayer.setDepth(0);

        const townStuffTileset = town.addTilesetImage("stuff_tiles", "town-stuff-tiles");
        const townStuffLayer = town.createLayer("stuff", townStuffTileset, 0, 0);
        townStuffLayer.setDepth(2);

        const playerSprite = this.add.sprite(0, 0, "base-character");
        playerSprite.setDepth(1);

        this.cameras.main.setBounds(
          0,
          0,
          (townJson.width) * GameScene.TILE_SIZE,
          (townJson.height + 1) * GameScene.TILE_SIZE
        );
        this.cameras.main.startFollow(playerSprite);
        this.cameras.main.roundPixels = true;
       
        if (this.getMainPlayer() === undefined) {
          this.setMainPlayer(
            new Player(
              playerSprite,
              data.user_datas.position,
              new Phaser.Math.Vector2(townJson.width, townJson.height)
            )
          );

          this.getMainPlayer().setPlayerAnimation("base-character");
        }
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
