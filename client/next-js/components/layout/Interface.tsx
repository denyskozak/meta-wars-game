import {SkillBar} from "../parts/SkillBar";
import {CastBar} from "../parts/CastBar";
import {Chat} from "../parts/Chat";
import {Coins} from "../parts/Coins";
import {Scoreboard} from "../parts/Scoreboard";
import {GameMenu} from "../parts/Menu";
import {Buffs} from "../parts/Buffs";
import {ComboPoints} from "../parts/ComboPoints";
import {ExperienceBar} from "../parts/ExperienceBar";
import {Progress} from "@heroui/react";

import {useInterface} from "@/context/inteface";
import {CLASS_ICONS} from "@/consts/classes";

import './Interface.css';
import Image from "next/image";
import React, {useEffect, useState} from "react";
import {MAX_HP, MAX_MANA} from "../../consts";

export const Interface = () => {
    const {
        state: { character },
    } = useInterface() as { state: { character: { name?: string, classType: string } | null } };
    const [target, setTarget] = useState<{id:number, hp:number, mana:number, address:string, classType?:string, buffs?:any[], debuffs?:any[]}|null>(null);
    const [selfStats, setSelfStats] = useState<{hp:number, mana:number, points:number, level:number, skillPoints:number, learnedSkills:Record<string, boolean>}>({hp: MAX_HP, mana: MAX_MANA, points: 0, level: 1, skillPoints:1, learnedSkills:{}});

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setTarget(e.detail);
        };
        window.addEventListener('target-update', handler as EventListener);
        return () => window.removeEventListener('target-update', handler as EventListener);
    }, []);

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            if (!e.detail) return;
            setSelfStats(prev => {
                if (
                    prev.hp === e.detail.hp &&
                    prev.mana === e.detail.mana &&
                    prev.points === e.detail.points &&
                    prev.level === e.detail.level &&
                    prev.skillPoints === e.detail.skillPoints
                ) {
                    return prev;
                }
                return e.detail;
            });
        };
        window.addEventListener('self-update', handler as EventListener);
        return () => window.removeEventListener('self-update', handler as EventListener);
    }, []);

    return (
        <div className="interface-container">
            {character && <div className="absolute top-24 left-5 flex items-center gap-2 bg-black/70 p-2 rounded">
                {character?.name && (
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                        <Image src={CLASS_ICONS[character.name] || ''} alt={character.name} width={250} height={250}/>
                    </div>
                )}
                <div className="w-40 space-y-1">
                    <p className="text-medium font-semibold">HP: {Math.round((selfStats.hp / MAX_HP) * 100)}</p>
                    <Progress id="hpBar" aria-label="HP" value={Math.round((selfStats.hp / MAX_HP) * 100)} color="secondary" disableAnimation />
                    <p className="text-medium font-semibold">{(character.classType === 'rogue' || character.classType === 'warrior') ? 'Energy' : 'Mana'}: {Math.round(selfStats.mana)}</p>
                    <Progress id="manaBar" aria-label={(character.classType === 'rogue' || character.classType === 'warrior') ? 'Energy' : 'Mana'} value={Math.round((selfStats.mana / MAX_MANA) * 100)} color="primary" disableAnimation />
                    <ComboPoints />
                </div>
            </div>}

            {target && (
                <div id="targetPanel" className="target-panel">
                    {target.classType && (
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                            <Image src={CLASS_ICONS[target.classType] || ''} alt={target.classType} width={250} height={250} />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <div id="targetAddress" className="target-address">{target.address}</div>
                        <p className="text-medium font-semibold">HP: {Math.round((target.hp / MAX_HP) * 100)}</p>
                        <Progress id="targetHpBar" aria-label="Target HP" value={Math.round((target.hp / MAX_HP) * 100)} color="secondary" className="mb-1 w-40" disableAnimation />
                        <p className="text-medium font-semibold">{(target.classType === 'rogue' || target.classType === 'warrior') ? 'Energy' : 'Mana'}: {Math.round(target.mana)}</p>
                        <Progress id="targetManaBar" aria-label={(target.classType === 'rogue' || target.classType === 'warrior') ? 'Target Energy' : 'Target Mana'} value={Math.round((target.mana / MAX_MANA) * 100)} color="primary" className="w-40" disableAnimation />
                    </div>
                </div>
            )}
            {target && (
                <Buffs buffs={target.buffs || []} debuffs={target.debuffs || []} className="target-buffs-container" />
            )}

            <div id="target" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '25px',
                height: '25px',
                transform: 'translate(-50%, -50%)',
                display: 'none', // Hidden by default
                pointerEvents: 'none',
                zIndex: 1000
            }}>

                <Image
                    id="targetImage"
                    alt="Target"
                    width={25}
                    height={25}
                    src="/icons/target.svg"
                />
            </div>

            <div id="selfDamage" className="self-damage-container"></div>



            <Scoreboard />
            <GameMenu />
            <Buffs />
            <SkillBar mana={selfStats.mana} level={selfStats.level} skillPoints={selfStats.skillPoints} learnedSkills={selfStats.learnedSkills}/>
            <CastBar/>
            <ExperienceBar />
            <Chat />
        </div>
    )
}