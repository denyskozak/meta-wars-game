import { useInterface } from "../../context/inteface";
import { useRouter } from "next/navigation";
import { ButtonWithSound as Button } from "../button-with-sound";
import "./Menu.css";

export const GameMenu = () => {
    const { state: { menuVisible }, dispatch } = useInterface();
    const router = useRouter();

    if (!menuVisible) return null;

    const closeMenu = () => dispatch({ type: 'SET_MENU_VISIBLE', payload: false });

    return (
        <div className="menu-overlay flex flex-col gap-2">
            <Button className="menu-button" onPress={() => {}}>
                Graphics
            </Button>
            <Button className="menu-button" onPress={() => {}}>
                General Settings
            </Button>
            <Button className="menu-button" onPress={() => router.push('/play')}>
                Exit Game
            </Button>
            <Button className="menu-button" onPress={closeMenu} color="primary">
                Return to Game
            </Button>
        </div>
    );
};
