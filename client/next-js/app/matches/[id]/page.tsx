"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Kbd } from "@heroui/kbd";
import { useParams, useRouter } from "next/navigation";

import { assetUrl } from "@/utilities/assets";
import { useWS } from "@/hooks/useWS";
import { Navbar } from "@/components/navbar";
import { useInterface } from "@/context/inteface";
import { InterfaceContextValue, MatchDetail, PlayerData } from "@/types";
import { CLASS_MODELS, CLASS_STATS, MAX_HP, MAX_MANA } from "@/consts";
import * as mageSkills from "@/skills/mage";
import * as warlockSkills from "@/skills/warlock";
import * as paladinSkills from "@/skills/paladin";
import * as rogueSkills from "@/skills/rogue";
import * as warriorSkills from "@/skills/warrior";

type Match = MatchDetail;

export default function MatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, sendToSocket } = useWS(params?.id);
  const { dispatch } = useInterface() as InterfaceContextValue;

  const [selectedClassPreview, setSelectedClassPreview] = useState<
    string | null
  >(null);

  const selectedStats = useMemo(() => {
    if (!selectedClassPreview) return null;
    const base = CLASS_STATS[selectedClassPreview] || {
      hp: MAX_HP,
      armor: 0,
      mana: MAX_MANA,
    };

    return { ...base, mana: base.mana || MAX_MANA };
  }, [selectedClassPreview]);

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<
    { id: number; address: string; classType: string }[]
  >([]);
  const [classType, setClassType] = useState("");
  const [skin, setSkin] = useState("bolvar");
  const [joined, setJoined] = useState(false);
  const classOptions = {
    warrior: {
      label: "Warrior",
      icon: assetUrl("/icons/warrior.webp"),
      type: "Melee",
      description: "Brutal melee fighter with unmatched strength.",
      skills: [
        {
          ...warriorSkills.warbringer,
          name: "Warbringer",
          description: "Charge to an enemy.",
        },
        {
          ...warriorSkills.savageBlow,
          name: "Savage Blow",
          description: "Powerful melee attack.",
        },
        {
          ...warriorSkills.hamstring,
          name: "Hamstring",
          description: "Slows the enemy.",
        },
        {
          ...warriorSkills.bladestorm,
          name: "Bladestorm",
          description: "Spin to hit all nearby foes.",
        },
        {
          ...warriorSkills.berserk,
          name: "Berserk",
          description: "Increase attack power.",
        },
        {
          ...warriorSkills.bloodthirst,
          name: "Bloodthirst",
          description: "Attack that heals you.",
        },
      ],
    },
    paladin: {
      label: "Paladin",
      icon: assetUrl("/icons/paladin.webp"),
      type: "Melee",
      description: "Holy warrior empowered by light.",
      skills: [
        {
          ...paladinSkills.lightstrike,
          name: "Light Strike",
          description: "Strike with holy power.",
        },
        {
          ...paladinSkills.stun,
          name: "Stun",
          description: "Stuns the enemy.",
        },
        {
          ...paladinSkills.paladinHeal,
          name: "Heal",
          description: "Restore health to an ally.",
        },
        {
          ...paladinSkills.lightwave,
          name: "Lightwave",
          description: "Wave of holy light.",
        },
        {
          ...paladinSkills.handOfFreedom,
          name: "Hand of Freedom",
          description: "Removes movement effects.",
        },
        {
          ...paladinSkills.divineSpeed,
          name: "Divine Speed",
          description: "Boosts movement speed.",
        },
      ],
    },
    rogue: {
      label: "Rogue",
      icon: assetUrl("/icons/rogue.webp"),
      type: "Melee",
      description: "Stealthy assassin striking from shadows.",
      skills: [
        {
          ...rogueSkills.bloodStrike,
          name: "Blood Strike",
          description: "Strike the enemy quickly.",
        },
        {
          ...rogueSkills.eviscerate,
          name: "Eviscerate",
          description: "Finishing move with high damage.",
        },
        {
          ...rogueSkills.shadowLeap,
          name: "Shadow Leap",
          description: "Leap through shadows to target.",
        },
        {
          ...rogueSkills.kidneyStrike,
          name: "Kidney Strike",
          description: "Stuns the enemy from behind.",
        },
        {
          ...rogueSkills.sprint,
          name: "Sprint",
          description: "Increase movement speed.",
        },
        {
          ...rogueSkills.adrenalineRush,
          name: "Adrenaline Rush",
          description: "Greatly boosts attack speed.",
        },
      ],
    },
    warlock: {
      label: "Warlock",
      icon: assetUrl("/icons/warlock.webp"),
      type: "Ranged",
      description: "Manipulator of dark magic.",
      skills: [
        {
          ...warlockSkills.darkball,
          name: "Darkball",
          description: "Shadow bolt dealing damage.",
        },
        {
          ...warlockSkills.corruption,
          name: "Corruption",
          description: "Inflicts damage over time.",
        },
        {
          ...warlockSkills.lifetap,
          name: "Lifetap",
          description: "Convert health into mana.",
        },
        {
          ...warlockSkills.chaosbolt,
          name: "Chaosbolt",
          description: "Unleash chaotic energy.",
        },
        {
          ...warlockSkills.fear,
          name: "Fear",
          description: "Terrifies the target.",
        },
        {
          ...warlockSkills.lifedrain,
          name: "Lifedrain",
          description: "Drain health from target.",
        },
      ],
    },
    mage: {
      label: "Mage",
      icon: assetUrl("/icons/mage.png"),
      type: "Ranged",
      description: "Master of arcane magic and spells.",
      skills: [
        {
          ...mageSkills.fireball,
          name: "Fireball",
          description: "Hurls a fiery ball.",
        },
        {
          ...mageSkills.iceball,
          name: "Iceball",
          description: "Launches a chilling bolt.",
        },
        {
          ...mageSkills.frostnova,
          name: "Frost Nova",
          description: "Freezes enemies around you.",
        },
        {
          ...mageSkills.blink,
          name: "Blink",
          description: "Teleport a short distance.",
        },
        {
          ...mageSkills.fireblast,
          name: "Fireblast",
          description: "Instant burst of flame.",
        },
        {
          ...mageSkills.pyroblast,
          name: "Pyroblast",
          description: "Massive fireball.",
        },
      ],
    },
  };

  console.log("players: ", players);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "GET_MATCH":
          if (message.match) {
            setMatch(message.match);
            setPlayers(
              (message.match.players as Array<[string, PlayerData]>).map(
                ([pid, pdata]) => ({
                  id: Number(pid),
                  address: pdata.address,
                  classType: pdata.classType,
                }),
              ),
            );
          }
          break;
        case "MATCH_JOINED":
          if (message.players) {
            setPlayers(
              (message.players as Array<[string, PlayerData]>).map(
                ([pid, pdata]) => ({
                  id: Number(pid),
                  address: pdata.address,
                  classType: pdata.classType,
                }),
              ),
            );
          }
          break;
        case "PLAYER_LEFT":
          setPlayers((prev) => prev.filter((p) => p.id !== message.playerId));
          break;
        case "MATCH_READY":
          router.push(`/matches/${params?.id}/game`);
          break;
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (classType && !joined) {
      const charModel = CLASS_MODELS[classType] || "vampir";

      sendToSocket({ type: "JOIN_MATCH", classType, character: charModel });
      sendToSocket({ type: "GET_MATCH" });
      setJoined(true);
      setSkin(charModel);
    }
  }, [classType, joined]);

  const handleReady = () => {
    if (!joined && classType) {
      const charModel = CLASS_MODELS[classType] || "vampir";

      sendToSocket({ type: "JOIN_MATCH", classType, character: charModel });
      setSkin(charModel);
    }
    dispatch({
      type: "SET_CHARACTER",
      payload: {
        name: classType.toLowerCase(),
        classType: classType.toLowerCase(),
        skin,
      },
    });
    router.push(`/matches/${params?.id}/game`);
  };

  return (
    <>
      <Modal
        isOpen={Boolean(selectedClassPreview)}
        onOpenChange={(open) => {
          if (!open) setSelectedClassPreview(null);
        }}
      >
        <ModalContent>
          {(onClose) =>
            selectedClassPreview && (
              <>
                <ModalHeader className="flex flex-col items-center gap-2">
                  <Image
                    alt={classOptions[selectedClassPreview].label}
                    height={120}
                    src={classOptions[selectedClassPreview].icon}
                    width={120}
                  />
                  <h3 className="text-xl font-bold text-yellow-300">
                    {classOptions[selectedClassPreview].label}
                  </h3>
                </ModalHeader>
                <ModalBody className="text-white">
                  <p className="text-sm text-center mt-1">
                    {classOptions[selectedClassPreview].description}
                  </p>
                  {selectedStats && (
                    <div className="mt-4 w-full">
                      <h4 className="text-yellow-400 text-sm font-semibold mb-1">
                        Stats
                      </h4>
                      <ul className="text-xs pl-4 list-disc">
                        <li>HP: {selectedStats.hp}</li>
                        <li>Mana: {selectedStats.mana}</li>
                        <li>Armor: {selectedStats.armor}</li>
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 w-full">
                    <h4 className="text-yellow-400 text-sm font-semibold mb-1">
                      Skills
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {classOptions[selectedClassPreview].skills.map((sk) => (
                        <div key={sk.id} className="flex gap-2 items-start">
                          <Image
                            alt={sk.name}
                            height={32}
                            src={sk.icon}
                            width={32}
                          />
                          <div className="text-xs">
                            <div className="font-semibold flex items-center gap-1">
                              {sk.name}
                              <Kbd>{sk.key}</Kbd>
                            </div>
                            <div className="text-[10px] text-gray-300">
                              {sk.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="flex gap-2">
                  <Button color="secondary" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => {
                      setClassType(selectedClassPreview);
                      onClose();
                    }}
                  >
                    Select
                  </Button>
                </ModalFooter>
              </>
            )
          }
        </ModalContent>
      </Modal>

      <div className="h-full">
        <Navbar />
        <div className="flex max-w-[650px] m-auto flex-col items-center mt-4 gap-4">
          {classType ? (
            <>
              <h2 className="text-xl font-semibold">
                Lobby: {match?.name || params?.id}
              </h2>
              <Table aria-label="Players">
                <TableHeader>
                  <TableColumn>Address</TableColumn>
                  <TableColumn>Class</TableColumn>
                </TableHeader>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.address}</TableCell>
                      <TableCell>
                        {p.classType}
                        <Image
                          alt={classOptions[p.classType].label || ""}
                          height={34}
                          src={classOptions[p.classType].icon || ""}
                          title={classOptions[p.classType].label || ""}
                          width={34}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex gap-4 items-center flex-col">
                <Button
                  color="primary"
                  disabled={!Boolean(classType)}
                  onPress={handleReady}
                >
                  Ready?
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col text-center">
              <span className="mb-1 text-large">Choose a Class:</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(classOptions).map(([value, opt]) => (
                  <button
                    key={value}
                    className="flex flex-col items-center justify-center p-2"
                    onClick={() => setSelectedClassPreview(value)}
                  >
                    <Image
                      alt={opt.label}
                      height={180}
                      src={opt.icon}
                      width={180}
                    />
                    <span className="text-xs mt-1">{opt.label}</span>
                    <span className="text-[10px] text-gray-300">
                      {opt.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
