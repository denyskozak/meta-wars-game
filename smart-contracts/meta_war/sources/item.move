module meta_war::item {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table;
    use sui::coin;

    use meta_war::coin::{COIN};
    use meta_war::admin::{AdminCap};

    /// Generic item that can store arbitrary options.
    public struct Item has key {
        id: UID,
        item_type: vector<u8>,
        options: table::Table<vector<u8>, vector<u8>>,
    }

    /// Reward amounts in coins for different places.
    public struct RewardTable has key {
        id: UID,
        simple: u64,
        rare: u64,
        epic: u64,
    }

    /// Create reward table specifying coin reward for each category.
    /// Requires admin capability to ensure only the server can mint rewards.
    public fun create_rewards(
        _cap: &AdminCap,
        simple: u64,
        rare: u64,
        epic: u64,
        ctx: &mut TxContext,
    ): RewardTable {
        RewardTable { id: object::new(ctx), simple, rare, epic }
    }

    /// Mint new item of given type with empty options table.
    /// Only callable by holder of the AdminCap.
    public fun create_item(
        _cap: &AdminCap,
        item_type: vector<u8>,
        ctx: &mut TxContext,
    ): Item {
        let options = table::new<vector<u8>, vector<u8>>(ctx);
        Item { id: object::new(ctx), item_type, options }
    }

    /// Create item with options provided in a table. The table is transferred
    /// into the new item. This allows the server to fully customise item
    /// metadata before minting.
    public fun create_item_with_options(
        _cap: &AdminCap,
        item_type: vector<u8>,
        options: table::Table<vector<u8>, vector<u8>>,
        ctx: &mut TxContext,
    ): Item {
        Item { id: object::new(ctx), item_type, options }
    }

    /// Add key-value option to the item.
    public fun add_option(item: &mut Item, key: vector<u8>, value: vector<u8>) {
        table::add(&mut item.options, key, value)
    }

    /// Reward coins according to the player place using reward table.
    public fun award_coins(
        rewards: &RewardTable,
        place: u64,
        treasury: &mut coin::TreasuryCap<COIN>,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        let amount = if (place == 1) {
            rewards.epic
        } else if (place == 2 || place == 3) {
            rewards.rare
        } else {
            rewards.simple
        };
        let coin = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coin, recipient)
    }
}
