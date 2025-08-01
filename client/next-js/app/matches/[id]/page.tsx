"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { ButtonWithSound as Button } from "@/components/button-with-sound";
import { assetUrl } from "@/utilities/assets";
import { useWS } from "@/hooks/useWS";
import { Navbar } from "@/components/navbar";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { useInterface } from "@/context/inteface";
import { InterfaceContextValue, MatchDetail, PlayerData } from "@/types";
import {
  CLASS_MODELS,
  CLASS_SKINS,
  CLASS_STATS,
  SKIN_NAMES,
  MAX_HP,
  MAX_MANA,
} from "@/consts";
import * as mageSkills from "@/skills/mage";
import * as warlockSkills from "@/skills/warlock";
import * as paladinSkills from "@/skills/paladin";
import * as rogueSkills from "@/skills/rogue";
import * as warriorSkills from "@/skills/warrior";
import { SkillsList } from "@/components/skills-list";

type Match = MatchDetail;

export default function MatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, sendToSocket } = useWS(params?.id);
  const { dispatch } = useInterface() as InterfaceContextValue;

  const [step, setStep] = useState(1);
  const [selectedClassPreview, setSelectedClassPreview] = useState<
    string | null
  >(null);
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const [skinIndex, setSkinIndex] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePrevSkin = () => {
    const skins =
      CLASS_SKINS[selectedClassPreview as keyof typeof CLASS_SKINS] || [];
    const idx = Math.max(0, skinIndex - 1);

    setSkinIndex(idx);
    setSelectedSkin(skins[idx] || null);
  };

  const handleNextSkin = () => {
    const skins =
      CLASS_SKINS[selectedClassPreview as keyof typeof CLASS_SKINS] || [];
    const idx = Math.min(skins.length - 1, skinIndex + 1);

    setSkinIndex(idx);
    setSelectedSkin(skins[idx] || null);
  };

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
    setSkinIndex(0);
    setStep(2);
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
          ...warriorSkills.hook,
          name: "Hook",
          description: "Pulls the enemy.",
        },
        {
          ...warriorSkills.bladestorm,
          name: "Bladestorm",
          description: "Spin to hit all nearby foes.",
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
          ...rogueSkills.kidneyStrike,
          name: "Kidney Strike",
          description: "Stuns the enemy from behind.",
        },
        {
          ...rogueSkills.sprint,
          name: "Sprint",
          description: "Increase movement speed.",
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
          ...mageSkills.fireBarrier,
          name: "Fire Barrier",
          description: "Absorbs incoming damage with flames.",
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
        case "CHARACTER_READY":
          router.push(`/matches/${params?.id}/game`);
          break;
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleClassSelect = (cls: string, skin: string | null) => {
    const charModel = skin || CLASS_MODELS[cls] || "vampir";

    dispatch({
      type: "SET_CHARACTER",
      payload: {
        name: cls,
        classType: cls,
        skin: charModel,
      },
    });

    sendToSocket({
      type: "SET_CHARACTER",
      classType: cls,
      character: charModel,
    });
  };

  return (
    <>
      <audio ref={previewAudioRef} hidden src="/button_click.ogg">
        <track kind="captions" />
      </audio>
      <div className="h-full">
        <Navbar />
        <div className="flex max-w-[650px] m-auto flex-col items-center mt-4 gap-4">
          {step === 1 && (
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
          )}

          {step === 2 && selectedClassPreview && (
            <div className="flex flex-col items-center text-white w-full">
              <Image
                alt={classOptions[selectedClassPreview].label}
                height={120}
                src={classOptions[selectedClassPreview].icon}
                width={120}
              />
              <h3 className="text-xl font-bold text-yellow-300 mt-2">
                {classOptions[selectedClassPreview].label}
              </h3>
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
              <SkillsList
                className="mt-4 w-full"
                skills={classOptions[selectedClassPreview].skills}
              />
              <div className="flex gap-2 mt-4">
                <Button variant="light" onPress={() => setStep(1)}>
                  Back
                </Button>
                <Button color="primary" onPress={() => setStep(3)}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && selectedClassPreview && (
            <div className="flex flex-col items-center w-full text-white">
              {selectedSkin && (
                <Image
                  alt={SKIN_NAMES[selectedSkin as keyof typeof SKIN_NAMES] ||
                    selectedSkin}
                  className="w-[200] h-[350]"
                  height={450}
                  src={`/images/skins/${selectedSkin}.jpg`}
                  width={200}
                />
              )}
              <div className="flex items-center gap-4 mt-4">
                <Button
                  isDisabled={skinIndex === 0}
                  variant="light"
                  onPress={handlePrevSkin}
                >
                  <ArrowLeftIcon size={20} />
                </Button>
                <span className="font-bold text-lg">
                  {SKIN_NAMES[selectedSkin as keyof typeof SKIN_NAMES] ||
                    selectedSkin}
                </span>
                <Button
                  isDisabled={
                    skinIndex ===
                    (
                      CLASS_SKINS[
                        selectedClassPreview as keyof typeof CLASS_SKINS
                      ] || []
                    ).length -
                      1
                  }
                  variant="light"
                  onPress={handleNextSkin}
                >
                  <ArrowRightIcon size={20} />
                </Button>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="light" onPress={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  color="primary"
                  onPress={() =>
                    handleClassSelect(selectedClassPreview, selectedSkin)
                  }
                >
                  Select
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
