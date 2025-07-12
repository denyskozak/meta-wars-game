"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import {
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
import { ButtonWithSound as Button } from "@/components/button-with-sound";
import { useParams, useRouter } from "next/navigation";

import { assetUrl } from "@/utilities/assets";
import { useWS } from "@/hooks/useWS";
import { Navbar } from "@/components/navbar";
import { useInterface } from "@/context/inteface";
import { InterfaceContextValue, MatchDetail, PlayerData } from "@/types";
import { CLASS_MODELS, CLASS_SKINS, CLASS_STATS, MAX_HP, MAX_MANA } from "@/consts";
import * as mageSkills from "@/skills/mage";
import * as warlockSkills from "@/skills/warlock";
import * as paladinSkills from "@/skills/paladin";
import * as rogueSkills from "@/skills/rogue";
import * as warriorSkills from "@/skills/warrior";
import { SkillsList } from "@/components/skills-list";
import SkinViewer from "@/components/skin-viewer";

type Match = MatchDetail;

export default function MatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, sendToSocket } = useWS(params?.id);
  const { dispatch } = useInterface() as InterfaceContextValue;

  const [selectedClassPreview, setSelectedClassPreview] = useState<
    string | null
  >(null);
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleClassPreview = (cls: string) => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.volume = 0.4;
        previewAudioRef.current.play().catch(() => {});
      } catch {
        // ignore play errors
      }
    }
    setSelectedClassPreview(cls);
    const skins = CLASS_SKINS[cls as keyof typeof CLASS_SKINS] || [];
    setSelectedSkin(skins[0] || null);
  };

  const selectedStats = useMemo(() => {
    if (!selectedClassPreview) return null;
    const base = CLASS_STATS[selectedClassPreview] || {
      hp: MAX_HP,
      armor: 0,
      mana: MAX_MANA,
    };

    return { ...base, mana: base.mana || MAX_MANA };
  }, [selectedClassPreview]);

  const [, setMatch] = useState<Match | null>(null);
  const [, setPlayers] = useState<
    { id: number; address: string; classType: string }[]
  >([]);
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
          ...warlockSkills.shadowbolt,
          name: "Shadowbolt",
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
          ...mageSkills.dragonBreath,
          name: "Dragon Breath",
          description: "Unleash fiery breath in a cone.",
        },
        {
          ...mageSkills.firering,
          name: "Fire Ring",
          description: "Blasts enemies away in flames.",
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
        case 'CHARACTER_READY':
          router.push(`/matches/${params?.id}/game`);
          break
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleClassSelect = (
    cls: string,
    skin: string | null,
    onClose: () => void,
  ) => {
    const charModel = skin || CLASS_MODELS[cls] || "vampir";

    dispatch({
      type: "SET_CHARACTER",
      payload: {
        name: cls,
        classType: cls,
        skin: charModel
      },
    });

    sendToSocket({ type: "SET_CHARACTER", classType: cls, character: charModel });

    // onClose();
  };

  return (
    <>
      <audio ref={previewAudioRef} hidden src="/button_click.ogg">
        <track kind="captions" />
      </audio>
      <Modal
        isOpen={Boolean(selectedClassPreview)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedClassPreview(null);
            setSelectedSkin(null);
          }
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
                  {selectedClassPreview && (
                    <div className="mt-4 w-full flex items-center gap-2">
                      <label className="text-sm">Skin:</label>
                      <select
                        className="text-black text-sm flex-1"
                        value={selectedSkin || ''}
                        onChange={(e) => setSelectedSkin(e.target.value)}
                      >
                    {(CLASS_SKINS[selectedClassPreview as keyof typeof CLASS_SKINS] || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedSkin && (
                <div className="mt-2 w-full h-48">
                  <SkinViewer skin={selectedSkin} />
                </div>
              )}
              <SkillsList
                className="mt-4 w-full"
                skills={classOptions[selectedClassPreview].skills}
              />
                </ModalBody>
                <ModalFooter className="flex gap-2">
                  <Button color="secondary" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => handleClassSelect(selectedClassPreview, selectedSkin, onClose)}
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
          <div className="flex flex-col text-center">
            <span className="mb-1 text-large">Choose a Class:</span>
            <div className="flex flex-row flex-wrap justify-center">
              {Object.entries(classOptions).map(([value, opt]) => (
                  <button
                      key={value}
                      className="flex flex-col items-center justify-center p-2"
                      onClick={() => handleClassPreview(value)}
                  >
                    <Image
                        alt={opt.label}
                        className="transition-transform hover:scale-110 focus:scale-110"
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
        </div>
      </div>
    </>
  );
}
