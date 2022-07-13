import Phaser from "phaser";
import Cookies from "js-cookie"
import Toastify from 'toastify-js'
import { Player } from "./player";
import { io } from "socket.io-client";
import { v5 as uuidv5 } from 'uuid';

import townGroundTiles from "../assets/maps/town/ground_tiles.png"
import townStuffTiles from "../assets/maps/town/stuff_tiles.png"
import townJson from "../assets/maps/town/town.json"

import algoislandGroundTiles from "../assets/maps/algoisland/ground_tiles.png"
import algoislandStuffTiles from "../assets/maps/algoisland/stuff_tiles.png"
import algoislandJson from "../assets/maps/algoisland/algoisland.json"

import codeislandGroundTiles from "../assets/maps/codeisland/ground_tiles.png"
import codeislandStuffTiles from "../assets/maps/codeisland/stuff_tiles.png"
import codeislandJson from "../assets/maps/codeisland/codeisland.json"

import dataislandGroundTiles from "../assets/maps/dataisland/ground_tiles.png"
import dataislandStuffTiles from "../assets/maps/dataisland/stuff_tiles.png"
import dataislandJson from "../assets/maps/dataisland/dataisland.json"

import hackislandGroundTiles from "../assets/maps/hackisland/ground_tiles.png"
import hackislandStuffTiles from "../assets/maps/hackisland/stuff_tiles.png"
import hackislandJson from "../assets/maps/hackisland/hackisland.json"

import netislandGroundTiles from "../assets/maps/netisland/ground_tiles.png"
import netislandStuffTiles from "../assets/maps/netisland/stuff_tiles.png"
import netislandJson from "../assets/maps/netisland/netisland.json"

import mentorcastleGroundTiles from "../assets/maps/mentorcastle/ground_tiles.png"
import mentorcastleStuffTiles from "../assets/maps/mentorcastle/stuff_tiles.png"
import mentorcastleJson from "../assets/maps/mentorcastle/mentorcastle.json"

import characterBase from "../assets/characters/base.png"

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export class GameScene extends Phaser.Scene {
  static TILE_SIZE = 32;

  constructor() {
    super();

    this.mainPlayer = undefined;
    this.players = undefined;
    this.nearbyEvent = "";
    this.chosenMap = [];

    this.maps = {
      town: {
        groundTiles: townGroundTiles,
        stuffTiles: townStuffTiles,
        json: townJson,
      },
      algoisland: {
        groundTiles: algoislandGroundTiles,
        stuffTiles: algoislandStuffTiles,
        json: algoislandJson,
      },
      codeisland: {
        groundTiles: codeislandGroundTiles,
        stuffTiles: codeislandStuffTiles,
        json: codeislandJson,
      },
      dataisland: {
        groundTiles: dataislandGroundTiles,
        stuffTiles: dataislandStuffTiles,
        json: dataislandJson,
      },
      hackisland: {
        groundTiles: hackislandGroundTiles,
        stuffTiles: hackislandStuffTiles,
        json: hackislandJson,
      },
      netisland: {
        groundTiles: netislandGroundTiles,
        stuffTiles: netislandStuffTiles,
        json: netislandJson,
      },
      mentorcastle: {
        groundTiles: mentorcastleGroundTiles,
        stuffTiles: mentorcastleStuffTiles,
        json: mentorcastleJson,
      }
    }
  }

  getChosenMap() {
    return this.chosenMap;
  }

  setChosenMap(chosenMap) {
    this.chosenMap = chosenMap;
  }

  getMainPlayer() {
    return this.mainPlayer;
  }

  setMainPlayer(mainPlayer) {
    this.mainPlayer = mainPlayer;
  }

  setPlayerPosition(player, position, direction = undefined) {
    if (player === "mainPlayer") {
      if (this.getMainPlayer() !== undefined) {
        this.getMainPlayer().setPosition(position, direction);
      }
    } else if (player !== undefined) {
      player.setPosition(position, direction)
    }
  }

  setCurrentRenderedMap(map) {
    if (this.getChosenMap().length > 0) {
      if (this.getChosenMap()[1] === map) return;
      else this.getChosenMap()[0].destroy();
    }

    const tilemap = this.make.tilemap({
      key: map,
    });

    const groundTileset = tilemap.addTilesetImage("ground_tiles", `${map}-ground-tiles`);
    const groundLayer = tilemap.createLayer("ground", groundTileset, 0, 0);
    groundLayer.setDepth(0);

    const stuffTileset = tilemap.addTilesetImage("stuff_tiles", `${map}-stuff-tiles`);
    const stuffLayer = tilemap.createLayer("stuff", stuffTileset, 0, 0);
    stuffLayer.setDepth(2);

    this.cameras.main.setBounds(
      0,
      0,
      (this.maps[map].json.width) * GameScene.TILE_SIZE,
      (this.maps[map].json.height + 1) * GameScene.TILE_SIZE
    );
    this.cameras.main.roundPixels = true;

    this.setChosenMap([tilemap, map]);
  }

  isEmptyObject(object) {
    for (var _ in object) return false;
    return true;
  }

  toast(text, isSuccess = true, gravity = "bottom", position = "center") {
    Toastify({
      text: text,
      duration: 3000,
      gravity: gravity,
      position: position,
      stopOnFocus: true,
      escapeMarkup: false,
      style: {
        "font-weight": "400",
        "font-family": "Merriweather Sans",
        "margin-left": "auto",
        "margin-right": "auto",
        left: "0",
        right: "0",
        position: "absolute",
        width: "max-content",
        color: isSuccess
          ? "black"
          : "white",
        background: isSuccess
          ? "linear-gradient(180deg, rgba(55,255,133,1) 0%, rgba(30,140,73,1) 100%)"
          : "linear-gradient(180deg, rgba(255,55,55,1) 0%, rgba(140,30,30,1) 100%);",
        border: "2px solid black",
        "border-radius": "0.5rem",
      },
    }).showToast();
  }

  toTitleCase(text) {
    let textToReturn = "";

    for (let i = 0; i < text.length; i++) {
      const el = text[i];
      if (el === "_") textToReturn += " ";
      else if (i === 0 || text[i - 1] === " " || text[i - 1] === "_") textToReturn += el.toUpperCase();
      else textToReturn += el.toLowerCase();
    }

    return textToReturn;
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

  setCharacterSpritesheet(player, spritesheetUrl) {
    const spriteId = uuidv5(spritesheetUrl, uuidv5.URL);
    this.load.spritesheet(spriteId, spritesheetUrl, {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.once("complete", () => {
      const newSprite = this.add.sprite(0, 0, spriteId);
      newSprite.setDepth(1);

      player.setSprite(newSprite);
      player.setPlayerAnimation(spriteId);
    })

    this.load.once("loaderror", (obj) => {
      this.toast(`Loading of ${obj} sprite error`, false);
    })

    this.load.start();
  }

  preload() {
    this.showLoadingScene();

    for (const [map, mapdata] of Object.entries(this.maps)) {
      this.load.image(`${map}-ground-tiles`, mapdata.groundTiles);
      this.load.image(`${map}-stuff-tiles`, mapdata.stuffTiles);
      this.load.tilemapTiledJSON(`${map}`, mapdata.json);
    }

    this.load.spritesheet("base-character", characterBase, {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    const socket = io(`http://localhost:${WEBSOCKET_PORT}`, {
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
        // Handler for nearby event
        if (data.event_name !== null && data.event_name !== undefined) {
          if (this.nearbyEvent === "" || this.nearbyEvent !== data.event_name) {
            const event_name = this.toTitleCase(data.event_name);
            this.toast(`There is a <b>${event_name}</b> nearby`);
          }
          this.nearbyEvent = data.event_name;
        } else {
          this.nearbyEvent = "";
        }

        this.setPlayerPosition("mainPlayer", parseInt(data.position), data.direction)
      }
    })

    socket.on("map_state", (data) => {
      if (data.map !== undefined && data.map !== this.getChosenMap()[1]) {
        this.setCurrentRenderedMap(data.map);
        this.getMainPlayer().setMapSize(
          new Phaser.Math.Vector2(
            this.maps[data.map].json.width,
            this.maps[data.map].json.height
          )
        );
        this.setPlayerPosition("mainPlayer", parseInt(data.position))
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

        this.setCurrentRenderedMap(data.user_datas.map);

        if (this.getMainPlayer() === undefined) {
          const playerSprite = this.add.sprite(0, 0, "base-character");
          playerSprite.setDepth(1);

          this.cameras.main.startFollow(playerSprite);
          const mainPlayer = new Player(
            playerSprite,
            data.user_datas.position,
            new Phaser.Math.Vector2(
              this.maps[data.user_datas.map].json.width,
              this.maps[data.user_datas.map].json.height
            )
          )

          mainPlayer.setPlayerAnimation("base-character");
          this.setMainPlayer(mainPlayer);

        } else {
          this.setPlayerPosition("mainPlayer", parseInt(data.user_datas.position));
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
