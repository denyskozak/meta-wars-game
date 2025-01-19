import './Coins.css';
import {useCoins} from "../../hooks/useCoins.js";

export const Coins = () => {
    const { coins } = useCoins();

    return (
        <div className="coins">
            Coins: {coins}
        </div>

    )
}