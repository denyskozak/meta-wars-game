module meta_war::profile {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    /// Player profile
    public struct Profile has key {
        id: UID,
        nickname: vector<u8>,
        rank: u64,
    }

    /// Create new profile with nickname and zero rank
    public fun create(nickname: vector<u8>, ctx: &mut TxContext): Profile {
        Profile { id: object::new(ctx), nickname, rank: 0 }
    }

    /// Update nickname
    public fun set_nickname(profile: &mut Profile, nickname: vector<u8>) {
        profile.nickname = nickname
    }

    /// Add rank points
    public fun add_rank(profile: &mut Profile, points: u64) {
        profile.rank = profile.rank + points
    }
}
