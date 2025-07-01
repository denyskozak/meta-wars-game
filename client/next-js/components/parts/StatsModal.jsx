import { useInterface } from "../../context/inteface";
import { useEffect, useState } from "react";
import { Modal } from "../modal";

export const StatsModal = () => {
    const { state: { statsVisible, character }, dispatch } = useInterface();
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

    return (
        <Modal
            open={statsVisible}
            title={`${character?.classType || ''} stats`}
            onChange={(open) => dispatch({ type: 'SET_STATS_VISIBLE', payload: open })}
            size="sm"
            actions={[]}
        >
            <div className="flex flex-col gap-1">
                <p>HP: {stats.hp} / {stats.maxHp}</p>
                <p>Armor: {stats.armor} / {stats.maxArmor}</p>
            </div>
        </Modal>
    );
};
