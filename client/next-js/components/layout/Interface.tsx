import {SkillBar} from "../parts/SkillBar";
import {CastBar} from "../parts/CastBar";
import {Chat} from "../parts/Chat";
import {Coins} from "../parts/Coins";

import './Interface.css';

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
                width: '10px',
                height: '10px',
                background: 'radial-gradient(circle, rgba(255,0,0,1) 0%, rgba(255,0,0,0.5) 70%, rgba(255,0,0,0) 100%)',
                borderRadius: '50%',
                boxShadow: '0 0 15px rgba(255, 0, 0, 0.8)',
                transform: 'translate(-50%, -50%) scale(1)',
                animation: 'pulse 1.5s infinite',
                display: 'none', // Hidden by default
                pointerEvents: 'none',
                zIndex: 1000
            }}></div>

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

            <SkillBar/>
            <CastBar/>
            <Chat />
            <Coins />
        </div>
    )
}