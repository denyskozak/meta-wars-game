import { useEffect, useState, useRef } from "react";
import { Progress } from "@heroui/react";

export const CastBar = () => {
    const [isCasting, setIsCasting] = useState(false);
    const [progress, setProgress] = useState(0);

    const intervalRef = useRef(null);
    const startRef = useRef(0);
    const durationRef = useRef(1500);
    const onEndRef = useRef(() => {});

    useEffect(() => {
        const handleStartCast = (e) => {
            const { duration = 1500, onEnd = () => {} } = e.detail || {};
            durationRef.current = duration;
            onEndRef.current = onEnd;
            setProgress(0);
            setIsCasting(true);

            startRef.current = Date.now();

            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startRef.current;
                const percent = Math.min((elapsed / durationRef.current) * 100, 100);
                setProgress(percent);

                if (percent >= 100) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    setIsCasting(false);
                    onEndRef.current?.();
                }
            }, 30); // обновление каждые 30мс
        };

        window.addEventListener("start-cast", handleStartCast);
        return () => {
            window.removeEventListener("start-cast", handleStartCast);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!isCasting) return null;

    return (
        <div className="fixed bottom-40 left-1/2 transform -translate-x-1/2 w-64 z-50">
            <Progress disableAnimation aria-label="Casting..." value={progress} color="warning" />
        </div>
    );
};
