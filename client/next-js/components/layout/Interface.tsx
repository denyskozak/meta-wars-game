import { Progress } from "@heroui/react";

import { KeyboardHints } from "../parts/KeyboardHints.jsx";
import { SkillBar } from "../parts/SkillBar.jsx";
import { CastBar } from "../parts/CastBar.jsx";
import { Chat } from "../parts/Chat.jsx";
import { Scoreboard } from "../parts/Scoreboard.jsx";
import { GameMenu } from "../parts/Menu.jsx";
import { Buffs } from "../parts/Buffs.jsx";
import { ComboPoints } from "../parts/ComboPoints.jsx";
import { ExperienceBar } from "../parts/ExperienceBar.jsx";
import { LevelUp } from "../parts/LevelUp.jsx";
import { KillNotification } from "../parts/KillNotification.jsx";
import { StatsModal } from "../parts/StatsModal.jsx";

import { useInterface } from "@/context/inteface";
import { CLASS_ICONS } from "@/consts/classes";

import "./Interface.css";
import Image from "next/image";
import React, { useEffect, useState } from "react";

import { MAX_HP, MAX_MANA } from "../../consts";

export const Interface = () => {
  const {
    state: { character },
  } = useInterface() as {
    state: { character: { name?: string; classType: string } | null };
  };
  const [target, setTarget] = useState<{
    id: number;
    hp: number;
    armor: number;
    maxHp: number;
    maxArmor: number;
    mana: number;
    maxMana: number;
    address: string;
    classType?: string;
    buffs?: any[];
    debuffs?: any[];
  } | null>(null);
  const [selfStats, setSelfStats] = useState<{
    hp: number;
    mana: number;
    armor: number;
    maxHp: number;
    maxArmor: number;
    maxMana: number;
    points: number;
    level: number;
    skillPoints: number;
    learnedSkills: Record<string, boolean>;
  }>({
    hp: MAX_HP,
    mana: MAX_MANA,
    armor: 0,
    maxHp: MAX_HP,
    maxArmor: 0,
    maxMana: MAX_MANA,
    points: 0,
    level: 1,
    skillPoints: 1,
    learnedSkills: {},
  });

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setTarget(e.detail);
    };

    window.addEventListener("target-update", handler as EventListener);

    return () =>
      window.removeEventListener("target-update", handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (!e.detail) return;
      setSelfStats((prev) => {
        if (
          prev.hp === e.detail.hp &&
          prev.mana === e.detail.mana &&
          prev.armor === e.detail.armor &&
          prev.maxHp === e.detail.maxHp &&
          prev.maxArmor === e.detail.maxArmor &&
          prev.maxMana === e.detail.maxMana &&
          prev.points === e.detail.points &&
          prev.level === e.detail.level &&
          prev.skillPoints === e.detail.skillPoints
        ) {
          return prev;
        }

        return e.detail;
      });
    };

    window.addEventListener("self-update", handler as EventListener);

    return () =>
      window.removeEventListener("self-update", handler as EventListener);
  }, []);

  useEffect(() => {
    const targetEl = document.getElementById("target");

    if (!targetEl) return;

    const handleStart = () => {
      targetEl.classList.add("casting");
    };
    const handleRelease = () => {
      targetEl.classList.remove("casting");
    };

    window.addEventListener("start-cast", handleStart as EventListener);
    window.addEventListener("release-cast", handleRelease as EventListener);

    return () => {
      window.removeEventListener("start-cast", handleStart as EventListener);
      window.removeEventListener(
        "release-cast",
        handleRelease as EventListener,
      );
    };
  }, []);

  return (
    <div className="interface-container absolute w-full h-full z-[2]">
      {character && (
        <div className="absolute top-24 left-5 flex items-center gap-2 bg-black/70 p-2 rounded">
          {character?.name && (
            <div className="w-20 h-20 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
              <Image
                alt={character.name}
                height={250}
                src={CLASS_ICONS[character.name] || ""}
                width={250}
              />
            </div>
          )}
          <div className="w-40 space-y-1">
            <p className="text-medium font-semibold">
              HP: {Math.round(selfStats.hp)}
            </p>
            <Progress
              disableAnimation
              aria-label="HP"
              color="secondary"
              id="hpBar"
              value={Math.round((selfStats.hp / selfStats.maxHp) * 100)}
            />
            <p className="text-medium font-semibold">
              {character.classType === "rogue" ||
              character.classType === "warrior"
                ? "Energy"
                : "Mana"}
              : {Math.round(selfStats.mana)}
            </p>
            <Progress
              disableAnimation
              aria-label={
                character.classType === "rogue" ||
                character.classType === "warrior"
                  ? "Energy"
                  : "Mana"
              }
              color={
                character.classType === "rogue" ||
                character.classType === "warrior"
                  ? "warning"
                  : "primary"
              }
              id="manaBar"
              value={Math.round((selfStats.mana / selfStats.maxMana) * 100)}
            />
            <ComboPoints />
          </div>
        </div>
      )}

      {target && (
        <div className="target-panel" id="targetPanel">
          {target.classType && (
            <div className="w-20 h-20 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
              <Image
                alt={target.classType}
                height={250}
                src={CLASS_ICONS[target.classType] || ""}
                width={250}
              />
            </div>
          )}
          <div className="flex flex-col">
            <div className="target-address" id="targetAddress">
              {target.address}
            </div>
            <p className="text-medium font-semibold">
              HP: {Math.round(target.hp)}
            </p>
            <Progress
              disableAnimation
              aria-label="Target HP"
              className="mb-1 w-40"
              color="secondary"
              id="targetHpBar"
              value={Math.round((target.hp / target.maxHp) * 100)}
            />
            <p className="text-medium font-semibold">
              {target.classType === "rogue" || target.classType === "warrior"
                ? "Energy"
                : "Mana"}
              : {Math.round(target.mana)}
            </p>
            <Progress
              disableAnimation
              aria-label={
                target.classType === "rogue" || target.classType === "warrior"
                  ? "Target Energy"
                  : "Target Mana"
              }
              className="w-40"
              color={
                target.classType === "rogue" || target.classType === "warrior"
                  ? "warning"
                  : "primary"
              }
              id="targetManaBar"
              value={Math.round((target.mana / target.maxMana) * 100)}
            />
          </div>
        </div>
      )}
      {target && (
        <Buffs
          buffs={target.buffs || []}
          className="target-buffs-container"
          debuffs={target.debuffs || []}
        />
      )}

      <div
        id="target"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "25px",
          height: "25px",
          transform: "translate(-50%, -50%)",
          display: "none", // Hidden by default
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        <div className="crosshair not-targeted" id="targetImage" />
      </div>

      <div className="self-damage-container" id="selfDamage" />

      <Scoreboard />
      <StatsModal />
      <GameMenu />
      <Buffs />
      <SkillBar
        learnedSkills={selfStats.learnedSkills}
        level={selfStats.level}
        mana={selfStats.mana}
        skillPoints={selfStats.skillPoints}
      />
      <CastBar />
      <ExperienceBar />
      <LevelUp />
      <KillNotification />
      <KeyboardHints />
      <Chat />
    </div>
  );
};
