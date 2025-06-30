import { useEffect, useState, useRef } from "react";
import { Progress } from "@heroui/react";

export const CastBar = () => {
    const [isCasting, setIsCasting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [icon, setIcon] = useState('');
    const [name, setName] = useState('');

    const intervalRef = useRef(null);
    const startRef = useRef(0);
    const durationRef = useRef(1500);
    const onEndRef = useRef(() => {});
    const isCastingRef = useRef(false);

    useEffect(() => {
        isCastingRef.current = isCasting;
    }, [isCasting]);

    useEffect(() => {
        const handleStartCast = (e) => {
            const { duration = 1500, onEnd = () => {}, icon = '', name = '' } = e.detail || {};
            durationRef.current = duration;
            onEndRef.current = onEnd;
            setIcon(icon);
            setName(name);
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
                }
            }, 30);
        };

        const handleReleaseCast = () => {
            if (!isCastingRef.current) return;
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, durationRef.current - elapsed);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setTimeout(() => {
                onEndRef.current?.();
            }, remaining);
            setIsCasting(false);
        };

        window.addEventListener("start-cast", handleStartCast);
        window.addEventListener("release-cast", handleReleaseCast);
        return () => {
            window.removeEventListener("start-cast", handleStartCast);
            window.removeEventListener("release-cast", handleReleaseCast);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!isCasting) return null;

    return (
        <div className="fixed bottom-40 left-1/2 transform -translate-x-1/2 w-64 z-50 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1 text-white">
                {icon && <img src={icon} alt={name} className="w-6 h-6" />}
                <span className="capitalize">{name}</span>
            </div>
            <div className="relative w-full">
                <Progress disableAnimation aria-label="Casting..." value={progress} color="warning" />
                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
};
