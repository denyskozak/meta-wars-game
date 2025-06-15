module meta_war::dao {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table;
    use sui::vector;

    use meta_war::admin::{AdminCap};

    const EAlreadyVoted: u64 = 0;

    /// Ticket granting right to participate in DAO voting
    public struct DaoTicket has key, store { id: UID }

    /// Voting proposal
    public struct Proposal has key, store {
        id: UID,
        description: vector<u8>,
        yes: u64,
        no: u64,
        voters: table::Table<address, bool>,
    }

    /// Mint DAO ticket. Requires admin cap
    public fun mint_ticket(_cap: &AdminCap, ctx: &mut TxContext): DaoTicket {
        DaoTicket { id: object::new(ctx) }
    }

    /// Create proposal with text description. Requires admin cap
    public fun create_proposal(
        _cap: &AdminCap,
        description: vector<u8>,
        ctx: &mut TxContext
    ): Proposal {
        Proposal {
            id: object::new(ctx),
            description,
            yes: 0,
            no: 0,
            voters: table::new<address, bool>(ctx),
        }
    }

    /// Vote for proposal using DAO ticket
    public fun vote(
        proposal: &mut Proposal,
        _ticket: &DaoTicket,
        in_favor: bool,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&proposal.voters, sender), EAlreadyVoted);
        table::add(&mut proposal.voters, sender, true);
        if (in_favor) {
            proposal.yes = proposal.yes + 1
        } else {
            proposal.no = proposal.no + 1
        }
    }
}
