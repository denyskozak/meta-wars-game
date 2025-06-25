import {useInterface} from '@/context/inteface';
import {useEffect, useState} from 'react';
import './Buffs.css';

export const Buffs = () => {
    const {state: {buffs = [], debuffs = []}} = useInterface();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    if (!buffs.length && !debuffs.length) return null;

    const formatTime = (ms) => {
        const total = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        if (minutes > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${seconds}`;
    };

    const getRemaining = (item) => {
        if (item.expires) {
            return item.expires - now;
        }
        if (item.ticks && item.interval && item.nextTick) {
            return (item.ticks - 1) * item.interval + (item.nextTick - now);
        }
        return 0;
    };

    const renderIcon = (item, idx, type) => {
        const timeLeft = getRemaining(item);
        return (
            <div key={`${type}-${idx}`} className="buff-icon">
                <img src={item.icon || '/icons/shield.png'} alt={item.type} />
                {item.stacks && <span className="stack-count">{item.stacks}</span>}
                {timeLeft > 0 && <span className="time">{formatTime(timeLeft)}</span>}
            </div>
        );
    };

    return (
        <div className="buffs-container">
            {buffs.map((b, idx) => renderIcon(b, idx, 'buff'))}
            {debuffs.map((d, idx) => renderIcon(d, idx, 'debuff'))}
        </div>
    );
};
