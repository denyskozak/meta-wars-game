import {useEffect, useState} from 'react';
import {useInterface} from '@/context/inteface';
import './SkillBar.css';
import * as mageSkills from '../../skills/mage';
import * as warlockSkills from '../../skills/warlock';
import * as paladinSkills from '../../skills/paladin';

const DEFAULT_SKILLS = [
    mageSkills.fireball,
    mageSkills.iceball,
    mageSkills.frostnova,
    mageSkills.blink,
    mageSkills.fireblast,
    mageSkills.pyroblast,
];

const WARLOCK_SKILLS = [
    warlockSkills.darkball,
    warlockSkills.corruption,
    warlockSkills.immolate,
    warlockSkills.chaosbolt,
    warlockSkills.fear,
    warlockSkills.lifedrain,
];

const PALADIN_SKILLS = [
    paladinSkills.lightstrike,
    paladinSkills.paladinHeal,
    paladinSkills.stun,
    paladinSkills.lightwave,
];

export const SkillBar = () => {
    const {state: {character}} = useInterface();
    let skills = DEFAULT_SKILLS;
    if (character?.name === 'warlock') skills = WARLOCK_SKILLS;
    else if (character?.name === 'paladin') skills = PALADIN_SKILLS;

    const [cooldowns, setCooldowns] = useState({});
    const [pressed, setPressed] = useState({});

    useEffect(() => {
        const handleCooldown = (e) => {
            const {skill, duration} = e.detail || {};
            if (!skill || !duration) return;
            setCooldowns((prev) => ({
                ...prev,
                [skill]: {end: Date.now() + duration, duration},
            }));
        };
        window.addEventListener('skill-cooldown', handleCooldown);
        const handleSkillUse = (e) => {
            const {skill} = e.detail || {};
            if (!skill) return;
            setPressed((p) => ({...p, [skill]: true}));
            setTimeout(() => {
                setPressed((p) => ({...p, [skill]: false}));
            }, 150);
        };
        window.addEventListener('skill-use', handleSkillUse);
        return () => {
            window.removeEventListener('skill-cooldown', handleCooldown);
            window.removeEventListener('skill-use', handleSkillUse);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCooldowns((prev) => {
                const updated = {...prev};
                let changed = false;
                Object.keys(updated).forEach((key) => {
                    const remaining = updated[key].end - Date.now();
                    if (remaining <= 0) {
                        delete updated[key];
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div id="skills-bar">
            {skills.map((skill) => {
                const data = cooldowns[skill.id];
                let text = skill.key;
                if (data) {
                    const remaining = data.end - Date.now();
                    text = Math.ceil(remaining / 1000);
                }
                return (
                    <div className={`skill-button${pressed[skill.id] ? ' pressed' : ''}`} key={skill.id}>
                        <div className="skill-icon" style={{backgroundImage: `url('${skill.icon}')`}}></div>
                        {data && (
                            <div className="cooldown-overlay">
                                {text}
                            </div>
                        )}
                        {!data && <div className="skill-key">{text}</div>}
                    </div>
                );
            })}
        </div>
    );
};
