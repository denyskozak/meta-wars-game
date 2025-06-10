import {useEffect, useState} from 'react';
import {useInterface} from '@/context/inteface';
import './SkillBar.css';
import * as mageSkills from '../../skills/mage';
import * as warlockSkills from '../../skills/warlock';

const DEFAULT_SKILLS = [
    mageSkills.fireball,
    mageSkills.iceball,
    mageSkills.fireblast,
    mageSkills.iceVeins,
];

const WARLOCK_SKILLS = [
    warlockSkills.darkball,
    warlockSkills.corruption,
    mageSkills.fireblast,
    mageSkills.iceVeins,
];

export const SkillBar = () => {
    const {state: {character}} = useInterface();
    const skills = character?.name === 'warlock' ? WARLOCK_SKILLS : DEFAULT_SKILLS;

    const [cooldowns, setCooldowns] = useState({});

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
        return () => window.removeEventListener('skill-cooldown', handleCooldown);
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
                let percent = 0;
                let text = skill.key;
                if (data) {
                    const remaining = data.end - Date.now();
                    percent = remaining / data.duration;
                    text = Math.ceil(remaining / 1000);
                }
                return (
                    <div className="skill-button" key={skill.id}>
                        <div className="skill-icon" style={{backgroundImage: `url('${skill.icon}')`}}></div>
                        {data && (
                            <div
                                className="cooldown-overlay"
                                style={{height: `${Math.max(0, percent) * 100}%`}}
                            >
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
