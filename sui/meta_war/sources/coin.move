module meta_war::coin {
    use sui::coin::{Self, TreasuryCap};
    use sui::url::new_unsafe_from_bytes;


    public struct COIN has drop {}

    fun init(witness: COIN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            6,
            b"METAWAR",
            b"Meta War",
            b"Unlimeneted open-source MMO RPG",
            option::some(new_unsafe_from_bytes(b"https://meta-wars.s3.us-west-2.amazonaws.com/vite.svg")),
            ctx);
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, ctx.sender())
    }

    public fun mint(
        treasury_cap: &mut TreasuryCap<COIN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient)
    }
}