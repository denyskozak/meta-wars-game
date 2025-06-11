import {SkillBar} from "../parts/SkillBar";
import {CastBar} from "../parts/CastBar";
import {Chat} from "../parts/Chat";
import {Coins} from "../parts/Coins";
import {Scoreboard} from "../parts/Scoreboard";
import {Buffs} from "../parts/Buffs";

import './Interface.css';
import Image from "next/image";
import React from "react";

export const Interface = () => {
    return (
        <div className="interface-container">
            <div className="bar-container hp-bar-container">
                <div className="bar-fill hp-bar-fill" id="hpBar"></div>
            </div>

            <div className="bar-container mana-bar-container">
                <div className="bar-fill mana-bar-fill" id="manaBar"></div>
            </div>

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
            <Coins />
        </div>
    )
}