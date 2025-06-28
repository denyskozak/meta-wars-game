import { useEffect, useRef, useState } from "react";
import "./LevelUp.css";

export const LevelUp = () => {
    const prevLevel = useRef(1);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            const lvl = e.detail?.level;
            if (typeof lvl === "number" && lvl > prevLevel.current) {
                prevLevel.current = lvl;
                setVisible(true);
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
        </>
    );
};
