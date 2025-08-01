module meta_war::admin {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::object;

    /// Capability representing the game administrator
    public struct AdminCap has key, store { id: UID }

    /// Create the AdminCap and transfer it to the deployer.
    /// Should be called once during deployment.
    public fun create_cap(ctx: &mut TxContext): AdminCap {
        let cap = AdminCap { id: object::new(ctx) };
        transfer::public_transfer(copy cap, tx_context::sender(ctx));
        cap
    }
}
