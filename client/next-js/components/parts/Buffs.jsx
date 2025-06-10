import {useInterface} from '@/context/inteface';
import './Buffs.css';

export const Buffs = () => {
    const {state: {buffs = [], debuffs = []}} = useInterface();

    if (!buffs.length && !debuffs.length) return null;

    const renderIcon = (item, idx, type) => (
        <div key={`${type}-${idx}`} className="buff-icon">
            <img src={item.icon || '/icons/shield.png'} alt={item.type} />
        </div>
    );

    return (
        <div className="buffs-container">
            {buffs.map((b, idx) => renderIcon(b, idx, 'buff'))}
            {debuffs.map((d, idx) => renderIcon(d, idx, 'debuff'))}
        </div>
    );
};
