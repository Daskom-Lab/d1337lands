import requests
import random
import json

from functools import lru_cache

game_url = "http://localhost:8080"


class Game:
    def __init__(self):
        self.maps = [
            "town",
            "codeisland",
            "algoisland",
            "hackisland",
            "dataisland",
            "netisland",
            "mentorcastle",
        ]

        self.maps_data = {}
        for map in self.maps:
            self.maps_data[map] = self.getMapData(map)

    def getIslandMaps(self):
        return [x for x in self.maps if x.endswith("island")]

    def getMapData(self, map_name):
        map_metadata = {}
        with requests.get(f"{game_url}/assets/maps/{map_name}/positioning.json") as r:
            map_metadata = json.loads(r.text)

        map_size = {}
        with requests.get(f"{game_url}/assets/maps/{map_name}/{map_name}.json") as r:
            data = json.loads(r.text)
            map_size = {"width": int(data["width"]), "height": int(data["height"])}

        map_data = {
            "collisions": map_metadata["Collision"],
            "map_size": map_size,
        }

        if map_name == "town":
            map_data["start_positions"] = map_metadata["RandomStart"]

            map_data["events"] = {
                # Main events
                "shop": map_metadata["ShopPos"],
                "leaderboard": map_metadata["LeaderboardPos"],
                "hall_of_fame": map_metadata["HoFPos"],
                "luck_pond": map_metadata["LuckPondPos"],
                "teleportation": map_metadata["TeleportationPos"],
                # Mentor castle teleportation
                "mentor_castle_right": map_metadata["MentorCastleRightPos"],
                "mentor_castle_left": map_metadata["MentorCastleLeftPos"],
                # Easter egg stuff
                "easter_egg_random": map_metadata["EasterEggRandomStart"],
                "easter_egg_activation": map_metadata["EasterEggActivationPos"],
                # Secret chess stuff
                "secret_chess_level_1": map_metadata["SecretChess1Pos"],
                "secret_chess_level_2": map_metadata["SecretChess2Pos"],
                "secret_chess_level_1_activation": map_metadata[
                    "SecretChess1ActivationPos"
                ],
                "secret_chess_level_2_activation": map_metadata[
                    "SecretChess2ActivationPos"
                ],
            }
        elif map_name == "mentorcastle":
            map_data["start_positions"] = [
                map_metadata["TeleportationLeftPos"],
                map_metadata["TeleportationRightPos"],
            ]

            map_data["events"] = {
                # Main events
                "submission_check": map_metadata["SubmissionCheckPos"],
            }
        else:
            map_data["start_positions"] = map_metadata["TeleportationPos"]

            map_data["events"] = {
                # Main events
                "hint": map_metadata["HintPos"],
                "quest": map_metadata["QuestPos"],
                "submission": map_metadata["SubmissionPos"],
                "submit_quest": map_metadata["SubmitQuestPos"],
            }

        return map_data

    def getRandomStartPosition(self, map_name, which=None):
        if map_name == "mentorcastle":
            if not which or which not in ["left", "right"]:
                raise ValueError(
                    "which have to be either 'left' or 'right' for mentorcastle"
                )

            return random.choice(
                self.maps_data[map_name]["start_positions"][0 if which == "left" else 1]
            )
        return random.choice(self.maps_data[map_name]["start_positions"])

    def getNextPosition(self, map_name, position, direction, check_collision=True):
        return self.__getNextPosition(self, map_name, position, direction, check_collision)

    @staticmethod
    @lru_cache(maxsize=16)
    def __getNextPosition(self, map_name, position, direction, check_collision):
        """
        Check if character can move to next position or not
        and get the next position if they can

        Note:
            * position should be 1-indexed number for the
            specific calculation implemented here
            * collision here will be considered as boolean
            value with either 0 (false) or more than 0 (true)
        """
        position = int(position)

        next_position = None
        if (
            direction == "up"
            and position > self.maps_data[map_name]["map_size"]["width"]
        ):
            next_position = position - self.maps_data[map_name]["map_size"]["width"]
        if (
            direction == "left"
            and position % self.maps_data[map_name]["map_size"]["width"] != 1
        ):
            next_position = position - 1
        if direction == "down" and position < (
            self.maps_data[map_name]["map_size"]["width"]
            * self.maps_data[map_name]["map_size"]["height"]
        ) - (self.maps_data[map_name]["map_size"]["width"] - 1):
            next_position = position + self.maps_data[map_name]["map_size"]["width"]
        if (
            direction == "right"
            and position % self.maps_data[map_name]["map_size"]["width"] != 0
        ):
            next_position = position + 1

        if not check_collision:
            return next_position

        if (
            next_position
            and next_position not in self.maps_data[map_name]["collisions"]
        ):
            return next_position
        else:
            return position

    def getNearbyEvent(self, map_name, position, threshold=1):
        return self.__getNearbyEvent(self, map_name, position, threshold)

    @staticmethod
    @lru_cache(maxsize=16)
    def __getNearbyEvent(self, map_name, position, threshold):
        """
        Check for nearby events from the current position of
        the player

        Note:
            * position should be 1-indexed number for the
            specific calculation implemented here
            * will return the event name and a boolean that
            check if the event is at the exact position as with
            the current player or not and will return None if
            there are no events nearby
            * exact location of the trigger is actually the
            position of that trigger + 1 blocks of threshold
            so threshold must be at least 1
        """
        exact_positions = []
        positions = [position]
        current_pos = position

        threshold = max(1, threshold)

        # Create a square movement to find nearby event within x blocks
        for x in range(1, threshold + 1):
            blocking = []
            next_pos = self.getNextPosition(map_name, current_pos, "up", False)

            if next_pos:
                current_pos = next_pos
                positions.append(current_pos)
            else:
                blocking.append("up")

            for _ in range(x):
                next_pos = self.getNextPosition(map_name, current_pos, "right", False)

                if next_pos:
                    current_pos = next_pos
                    positions.append(current_pos)
                else:
                    blocking.append("right")

            for _ in range(x * 2):
                if "up" in blocking:
                    blocking.remove("up")
                    continue

                next_pos = self.getNextPosition(map_name, current_pos, "down", False)

                if next_pos:
                    current_pos = next_pos
                    positions.append(current_pos)
                else:
                    blocking.append("down")

            for _ in range(x * 2):
                if "right" in blocking:
                    blocking.remove("right")
                    continue

                next_pos = self.getNextPosition(map_name, current_pos, "left", False)

                if next_pos:
                    current_pos = next_pos
                    positions.append(current_pos)
                else:
                    blocking.append("left")

            for _ in range(x * 2):
                if "down" in blocking:
                    blocking.remove("down")
                    continue

                next_pos = self.getNextPosition(map_name, current_pos, "up", False)

                if next_pos:
                    current_pos = next_pos
                    positions.append(current_pos)

            for y in range(x):
                if "left" in blocking:
                    blocking.remove("left")
                    continue

                next_pos = self.getNextPosition(map_name, current_pos, "right", False)

                if next_pos:
                    current_pos = next_pos
                    if y != x - 1:
                        positions.append(current_pos)

            if x == 1:
                exact_positions.extend(positions)

        events = self.maps_data[map_name]["events"]
        for event_name in events.keys():
            for event_pos in events[event_name]:
                if event_pos in exact_positions:
                    return [event_name, True]

                if event_pos in positions:
                    return [event_name, False]

        return None
