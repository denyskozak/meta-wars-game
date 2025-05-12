import './Coins.css';
import {useCoins} from "../../hooks/useCoins";

export const Coins = () => {
    const { coins } = useCoins();

    return (
        <div className="coins">
            Gold: {coins}
        </div>

    )
}