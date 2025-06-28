import { useEffect, useRef, useState } from "react";
import "./LevelUp.css";

export const LevelUp = () => {
    const prevLevel = useRef(1);
    const [visible, setVisible] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            const lvl = e.detail?.level;
            if (typeof lvl === "number" && lvl > prevLevel.current) {
                prevLevel.current = lvl;
                setVisible(true);
                const audio = audioRef.current;
                if (audio) {
                    audio.currentTime = 0;
                    audio.play();
                }
                setTimeout(() => setVisible(false), 3000);
            }
        };
        window.addEventListener("self-update", handler);
        return () => window.removeEventListener("self-update", handler);
    }, []);

    return (
        <>
            {visible && (
                <div className="level-up-overlay">
                    <div className="level-up-text">Level Up!</div>
                </div>
            )}
            <audio ref={audioRef} src="/sounds/level-up.ogg" />
        </>
    );
};
