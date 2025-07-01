import { useEffect, useState } from "react";
import "./KillNotification.css";

export const KillNotification = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = () => {
            setVisible(true);
            setTimeout(() => setVisible(false), 3000);
        };
        window.addEventListener("player-kill", handler);
        return () => window.removeEventListener("player-kill", handler);
    }, []);

    return (
        <>
            {visible && (
                <div className="kill-overlay">
                    <div className="kill-text">KILL!</div>
                </div>
            )}
        </>
    );
};
