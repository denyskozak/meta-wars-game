import { useEffect, useState } from "react";
import './Countdown.css';

export const Countdown = ({ seconds = 0, onComplete = () => {} }) => {
    const [count, setCount] = useState(seconds);

    useEffect(() => {
        setCount(seconds);
    }, [seconds]);

    useEffect(() => {
        if (count <= 0) return;
        const timer = setTimeout(() => {
            setCount((c) => c - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [count]);

    useEffect(() => {
        if (count === 0 && seconds > 0) {
            onComplete();
        }
    }, [count, seconds, onComplete]);

    if (count <= 0) return null;

    return (
        <div className="countdown-overlay">{count}</div>
    );
};
