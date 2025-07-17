import {useEffect, useRef, useState} from 'react';
import {useInterface} from '@/context/inteface';
import {useWS} from '../../hooks/useWS';
import { SPELL_COST } from '@/consts';
import './SkillBar.css';
import * as mageSkills from '../../skills/mage';
import * as warlockSkills from '../../skills/warlock';
import * as paladinSkills from '../../skills/paladin';
import * as rogueSkills from '../../skills/rogue';
import * as warriorSkills from '../../skills/warrior';

const DEFAULT_SKILLS = [
    mageSkills.fireball,
    mageSkills.fireBarrier,
    mageSkills.firering,
    mageSkills.blink,
];

const WARLOCK_SKILLS = [
    warlockSkills.shadowbolt,
    warlockSkills.corruption,
    warlockSkills.lifetap,
    warlockSkills.lifedrain,
];

const PALADIN_SKILLS = [
    paladinSkills.lightstrike,
    paladinSkills.stun,
    paladinSkills.paladinHeal,
    paladinSkills.divineSpeed,
];

const ROGUE_SKILLS = [
    rogueSkills.bloodStrike,
    rogueSkills.eviscerate,
    rogueSkills.kidneyStrike,
    rogueSkills.sprint,
];

const WARRIOR_SKILLS = [
    warriorSkills.warbringer,
    warriorSkills.savageBlow,
    warriorSkills.hook,
    warriorSkills.bladestorm,
];

export const SkillBar = ({ mana = 0, level = 1, skillPoints = 0, learnedSkills = {} }) => {
    const {state: {character}} = useInterface();
    let skills = DEFAULT_SKILLS;
    if (character?.name === 'warlock') skills = WARLOCK_SKILLS;
    else if (character?.name === 'paladin') skills = PALADIN_SKILLS;
    else if (character?.name === 'rogue') skills = ROGUE_SKILLS;
    else if (character?.name === 'warrior') skills = WARRIOR_SKILLS;

    const [cooldowns, setCooldowns] = useState({});
    const [pressed, setPressed] = useState({});
    const [learned, setLearned] = useState(learnedSkills || {});
    const [ready, setReady] = useState({});
    const [points, setPoints] = useState(skillPoints);
    const prevLevel = useRef(level);
    const { sendToSocket } = useWS();

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
        if (level !== prevLevel.current) {
            prevLevel.current = level;
            setPoints(skillPoints);
        }
    }, [level, skillPoints]);

    useEffect(() => {
        setLearned(learnedSkills || {});
    }, [learnedSkills]);

    useEffect(() => {
        const interval = setInterval(() => {
            const finished = [];
            setCooldowns((prev) => {
                const updated = { ...prev };
                let changed = false;
                Object.keys(updated).forEach((key) => {
                    const remaining = updated[key].end - Date.now();
                    if (remaining <= 0) {
                        delete updated[key];
                        finished.push(key);
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
            if (finished.length) {
                finished.forEach((key) => {
                    setReady((r) => ({ ...r, [key]: true }));
                    setTimeout(() => {
                        setReady((r) => {
                            const { [key]: _removed, ...rest } = r;
                            return rest;
                        });
                    }, 400);
                });
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // handle Shift+Key to learn skills
    useEffect(() => {
        const handler = (e) => {
            if (!e.shiftKey || points <= 0) return;
            const code = e.code;
            const skill = skills.find(s => {
                const key = s.key;
                const targetCode = /\d/.test(key) ? `Digit${key}` : `Key${key.toUpperCase()}`;
                return targetCode === code;
            });
            if (skill && !learned[skill.id]) {
                setLearned(l => ({ ...l, [skill.id]: true }));
                setPoints(p => p - 1);
                sendToSocket({ type: 'LEARN_SKILL', skillId: skill.id });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [points, learned, skills, sendToSocket]);

    return (
        <div id="skills-bar">
            {skills.map((skill) => {
                const data = cooldowns[skill.id];
                let text = skill.key;
                if (data) {
                    const remaining = data.end - Date.now();
                    text = Math.ceil(remaining / 1000);
                }
                const insufficientMana = mana < (SPELL_COST[skill.id] || 0);
                const locked = !learned[skill.id];
                return (
                    <div className={`skill-button${pressed[skill.id] ? ' pressed' : ''}${insufficientMana ? ' no-mana' : ''}${locked ? ' locked' : ''}${ready[skill.id] ? ' ready' : ''}`} key={skill.id}>
                        <div className="skill-icon" style={{backgroundImage: `url('${skill.icon}')`}}></div>
                        {locked && points > 0 && <div className="skill-plus">+</div>}
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
