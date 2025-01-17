module metawars::character {
    use std::string::{String};

    /// Represents a character in the game.
    public struct Character has key, store {
        id: UID,
        name: String,
        class: String,
        race: String,
    }

    /// Creates a new character and transfers it to the sender's address.
    public fun create_character(
        name: String,
        class: String,
        race: String,
        ctx: &mut TxContext
    ): Character {
        Character {
            id: object::new(ctx),
            name,
            class,
            race,
        }
    }

    public fun delete(character: Character) {
        let Character { id, name: _, class: _, race: _ } = character;
        object::delete(id);
    }
}
