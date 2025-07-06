import Image from "next/image";
import React from "react";

import { SkillsList } from "@/components/skills-list";
import { useInterface } from "@/context/inteface";
import * as mageSkills from "@/skills/mage";
import * as warlockSkills from "@/skills/warlock";
import * as paladinSkills from "@/skills/paladin";
import * as rogueSkills from "@/skills/rogue";
import * as warriorSkills from "@/skills/warrior";

interface LoadingProps {
  text: string;
}

const CLASS_SKILLS = {
  warrior: [
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
  paladin: [
    {
      ...paladinSkills.lightstrike,
      name: "Light Strike",
      description: "Strike with holy power.",
    },
    { ...paladinSkills.stun, name: "Stun", description: "Stuns the enemy." },
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
  rogue: [
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
  warlock: [
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
  mage: [
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
} as const;

export const Loading = ({ text }: LoadingProps) => {
  const {
    state: { character },
  } = useInterface() as { state: { character: { name?: string } | null } };
  const skills = character?.name
    ? CLASS_SKILLS[character.name as keyof typeof CLASS_SKILLS]
    : [];

  const imageSrc = React.useMemo(() => {
    const images = [
      "/loading-1.webp",
      "/loading-2.webp",
      "/loading-3.webp",
      "/loading-4.webp",
      "/loading-5.webp",
    ];

    return images[Math.floor(Math.random() * images.length)];
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Image
        alt="Turtle Art"
        className="absolute top-0 left-0 w-full h-full object-cover z-[2]"
        height={1961}
        src={imageSrc}
        width={3840}
      />
      <span className="absolute z-[3] text-xl font-semibold text-white">
        {text}
      </span>
      {skills && skills.length > 0 && (
        <SkillsList
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[3] bg-black/70 p-4 rounded max-w-md text-white text-xs"
          headingClassName="text-center text-sm font-bold mb-2"
          skills={skills}
        />
      )}
    </div>
  );
};
