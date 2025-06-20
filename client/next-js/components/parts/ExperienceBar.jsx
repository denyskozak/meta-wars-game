import { useEffect, useState } from "react";
import { Progress } from "@heroui/react";
import { XP_PER_LEVEL } from "@/consts";

export const ExperienceBar = () => {
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);

    useEffect(() => {
        const handler = (e) => {
            if (!e.detail) return;
            if (typeof e.detail.points === 'number') setXp(e.detail.points);
            if (typeof e.detail.level === 'number') setLevel(e.detail.level);
        };
        window.addEventListener('self-update', handler);
        return () => window.removeEventListener('self-update', handler);
    }, []);

    const progress = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

    return (
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 w-full max-w-xl px-4 z-50 flex flex-col items-center">
            <Progress id="xpBar" aria-label="XP" value={progress} color="warning" className="w-full" disableAnimation />
            <div className="text-white text-sm font-semibold mt-1">Level {level}</div>
        </div>
    );
};
