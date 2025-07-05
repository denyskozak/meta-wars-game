import Image from "next/image";
import { Kbd } from "@heroui/kbd";
import React from "react";

interface Skill {
  id: string | number;
  icon: string;
  key: string | number;
  name: string;
  description: string;
}

interface SkillsListProps {
  skills: Skill[];
  /** Additional classes for the container */
  className?: string;
  /** Classes for the title */
  headingClassName?: string;
  /** Heading text */
  title?: string;
}

export const SkillsList = ({
  skills,
  className = "",
  headingClassName = "text-yellow-400 text-sm font-semibold mb-1",
  title = "Skills",
}: SkillsListProps) => {
  if (!skills || skills.length === 0) return null;
  return (
    <div className={className}>
      <h4 className={headingClassName}>{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {skills.map((sk) => (
          <div key={sk.id} className="flex gap-2 items-start">
            <Image alt={sk.name} height={32} src={sk.icon} width={32} />
            <div className="text-xs">
              <div className="font-semibold flex items-center gap-1">
                {sk.name}
                <Kbd>{sk.key}</Kbd>
              </div>
              <div className="text-[10px] text-gray-300">{sk.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
