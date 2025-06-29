import { useInterface } from "../../context/inteface";
import { useEffect, useState } from "react";
import './StatsModal.css';

export const StatsModal = () => {
    const { state: { statsVisible, character } } = useInterface();
    const [stats, setStats] = useState({hp:0, armor:0, maxHp:0, maxArmor:0});

    useEffect(() => {
        const handler = (e) => {
            if (e.detail) {
                setStats({
                    hp: e.detail.hp,
                    armor: e.detail.armor,
                    maxHp: e.detail.maxHp,
                    maxArmor: e.detail.maxArmor,
                });
            }
        };
        window.addEventListener('self-update', handler);
        return () => window.removeEventListener('self-update', handler);
    }, []);

    if (!statsVisible) return null;

    return (
        <div className="stats-overlay">
            <h2 className="stats-title">{character?.classType} stats</h2>
            <p>HP: {stats.hp} / {stats.maxHp}</p>
            <p>Armor: {stats.armor} / {stats.maxArmor}</p>
        </div>
    );
};
