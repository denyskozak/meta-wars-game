import {SkillBar} from "../parts/SkillBar";
import {CastBar} from "../parts/CastBar";
import {Chat} from "../parts/Chat";
import {Coins} from "../parts/Coins";
import {Scoreboard} from "../parts/Scoreboard";
import {Buffs} from "../parts/Buffs";
import {Progress} from "@heroui/react";

import {useInterface} from "@/context/inteface";
import {CLASS_ICONS} from "@/consts/classes";

import './Interface.css';
import Image from "next/image";
import React, {useEffect, useState} from "react";
import {MAX_HP} from "../../consts";

export const Interface = () => {
    const {
        state: { character },
    } = useInterface() as { state: { character: { name?: string } | null } };
    const [target, setTarget] = useState<{id:number, hp:number, mana:number, address:string, classType?:string}|null>(null);
    const [selfStats, setSelfStats] = useState<{hp:number, mana:number}>({hp: MAX_HP, mana: 100});

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setTarget(e.detail);
        };
        window.addEventListener('target-update', handler as EventListener);
        return () => window.removeEventListener('target-update', handler as EventListener);
    }, []);

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setSelfStats(e.detail);
        };
        window.addEventListener('self-update', handler as EventListener);
        return () => window.removeEventListener('self-update', handler as EventListener);
    }, []);

    return (
        <div className="interface-container">
            <div className="absolute top-24 left-5 flex items-center gap-2">
                {character?.name && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                        <Image src={CLASS_ICONS[character.name] || ''} alt={character.name} width={32} height={32}/>
                    </div>
                )}
                <div className="w-40 space-y-1">
                    <Progress id="hpBar" aria-label="HP" value={(selfStats.hp / MAX_HP) * 100} color="secondary" disableAnimation />
                    <Progress id="manaBar" aria-label="Mana" value={selfStats.mana} color="primary" disableAnimation />
                </div>
            </div>

            {target && (
                <div id="targetPanel" className="target-panel">
                    {target.classType && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-black/50 flex items-center justify-center">
                            <Image src={CLASS_ICONS[target.classType] || ''} alt={target.classType} width={32} height={32} />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <div id="targetAddress" className="target-address">{target.address}</div>
                        <Progress id="targetHpBar" aria-label="Target HP" value={(target.hp / MAX_HP) * 100} color="secondary" className="mb-1 w-40" disableAnimation />
                        <Progress id="targetManaBar" aria-label="Target Mana" value={target.mana} color="primary" className="w-40" disableAnimation />
                    </div>
                </div>
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

            <button
                id="respawnButton"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '10px 20px',
                    fontSize: '20px',
                    display: 'none', // Скрыто по умолчанию
                    zIndex: 1000,
                    pointerEvents: 'auto'
                }}
            >
                Enter for Respawn
            </button>

            <Scoreboard />
            <Buffs />
            <SkillBar/>
            <CastBar/>
            <Chat />
        </div>
    )
}