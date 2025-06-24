import { useInterface } from "../../context/inteface";
import { useRouter } from "next/navigation";
import "./Menu.css";

export const GameMenu = () => {
    const { state: { menuVisible }, dispatch } = useInterface();
    const router = useRouter();

    if (!menuVisible) return null;

    const closeMenu = () => dispatch({ type: 'SET_MENU_VISIBLE', payload: false });

    return (
        <div className="menu-overlay">
            <button className="menu-button">Graphics</button>
            <button className="menu-button">General Settings</button>
            <button className="menu-button" onClick={() => router.push('/play')}>Exit Game</button>
            <button className="menu-button" onClick={closeMenu}>Return to Game</button>
        </div>
    );
};
