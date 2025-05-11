module meta_war::character {
    use std::string::{String};

    public struct Character has key, store {
        id: UID,
        name: String,
        class: String,
    }

    public fun create_character(
        name: String,
        class: String,
        ctx: &mut TxContext
    ): Character {
        Character {
            id: object::new(ctx),
            name,
            class,
        }
    }

    public fun delete(character: Character) {
        let Character { id, name: _, class: _ } = character;
        object::delete(id);
    }
}
