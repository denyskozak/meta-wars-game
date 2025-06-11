module meta_war::staking {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin;

    use meta_war::coin::{COIN};

    /// Error when a non-owner attempts to unstake
    const ENotOwner: u64 = 0;

    /// Object that holds staked coins
    public struct Stake has key {
        id: UID,
        owner: address,
        coins: coin::Coin<COIN>,
    }

    /// Stake coins by locking them in a `Stake` object
    public fun stake(coins: coin::Coin<COIN>, ctx: &mut TxContext): Stake {
        Stake { id: object::new(ctx), owner: tx_context::sender(ctx), coins }
    }

    /// Unstake previously staked coins
    public fun unstake(stake: Stake, ctx: &mut TxContext) {
        let Stake { id, owner, coins } = stake;
        assert!(owner == tx_context::sender(ctx), ENotOwner);
        transfer::public_transfer(coins, owner);
        object::delete(id);
    }
}
