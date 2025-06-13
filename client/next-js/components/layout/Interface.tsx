import {SkillBar} from "../parts/SkillBar";
import {CastBar} from "../parts/CastBar";
import {Chat} from "../parts/Chat";
import {Coins} from "../parts/Coins";
import {Scoreboard} from "../parts/Scoreboard";
import {Buffs} from "../parts/Buffs";

import './Interface.css';
import Image from "next/image";
import React, {useEffect, useState} from "react";

export const Interface = () => {
    const [target, setTarget] = useState<{id:number, hp:number, mana:number, address:string}|null>(null);

    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setTarget(e.detail);
        };
        window.addEventListener('target-update', handler as EventListener);
        return () => window.removeEventListener('target-update', handler as EventListener);
    }, []);

    return (
        <div className="interface-container">
            <div className="bar-container hp-bar-container">
                <div className="bar-fill hp-bar-fill" id="hpBar"></div>
            </div>

            <div className="bar-container mana-bar-container">
                <div className="bar-fill mana-bar-fill" id="manaBar"></div>
            </div>

            {target && (
                <div id="targetPanel" className="target-panel">
                    <div id="targetAddress" className="target-address">{target.address}</div>
                    <div className="bar-container hp-bar-container">
                        <div className="bar-fill hp-bar-fill" id="targetHpBar" style={{width: `${target.hp}%`}}></div>
                    </div>
                    <div className="bar-container mana-bar-container">
                        <div className="bar-fill mana-bar-fill" id="targetManaBar" style={{width: `${target.mana}%`}}></div>
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