import {
  Championship as ChampionshipType,
  Championship,
  Sponsor,
  Team,
} from "@/types";

export const MIST_PER_SUI = 1000000000;

export function convertMistToSui(suiAmount?: number): string {
  if (suiAmount === undefined) return "0";

  return (suiAmount / MIST_PER_SUI).toFixed(2);
}

export const renderJoinButtonText = (championship: ChampionshipType): string =>
  championship.ticketPrice === 0
    ? "Free"
    : `${convertMistToSui(championship.ticketPrice)} coins`;

export const renderStatus = (status: number): string => {
  switch (status) {
    case 0:
      return "Open";
      break;
    case 1:
      return "On-going";
      break;
    case 2:
      return "Done";
      break;
    default:
      return "Unknown";
  }
};

// map champ

interface MoveTeam {
  name: string;
  leader_address: string;
  lead_nickname: string;
  teammate_nicknames: string[];
}

interface MoveSponsor {
  address: string;
  title: string;
  amount: string;
}

const mapTeam = (team: MoveTeam): Team => ({
  name: team.name,
  leaderAddress: team.leader_address,
  leadNickname: team.lead_nickname,
  teammateNicknames: team.teammate_nicknames,
});

const mapSponsor = (sponsor: MoveSponsor): Sponsor => ({
  address: sponsor.address,
  title: sponsor.title,
  amount: Number(sponsor.amount),
});

export interface MoveChampionshipGraphQL {
  id: string;
  title: string;
  description: string;
  game_name: string;
  ticket_price: string;
  date_start: string;
  reward_pool: {
    value: string;
  };
  admin: {
    address: string;
    discord_nickname: string;
  };
  discord_chat_link: string;
  team_size: string;
  teams_limit: number;
  winners_amount: number;
  teams: MoveTeam[];
  sponsors: MoveSponsor[];
  bracket?: {
    matches: {
      team_a: MoveTeam;
      team_b: MoveTeam;
      winner_leader_address: string | null;
      round: string;
    }[];
    current_round: string;
  };
  status: number;
}

export const mapChampionshipGraphQL = (
  item: MoveChampionshipGraphQL,
): Championship => {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    gameName: item.game_name,
    dateStart: Number(item.date_start),
    ticketPrice: Number(item.ticket_price),
    rewardPool: {
      value: Number(item.reward_pool?.value),
    },
    status: Number(item.status),
    teamSize: Number(item.team_size),
    participantsLimit: Number(item.teams_limit),
    winnersAmount: Number(item.winners_amount),
    discordLink: item.discord_chat_link,
    admin: {
      address: item.admin.address,
      nickname: item.admin.discord_nickname,
    },
    teams: item.teams.map(mapTeam),
    sponsors: item.sponsors.map(mapSponsor),
    bracket: item.bracket
      ? {
          currentRound: Number(item.bracket.current_round),
          matches: item.bracket.matches.map((match) => ({
            teamA: mapTeam(match.team_a),
            teamB: mapTeam(match.team_b),
            winnerLeaderAddress: match.winner_leader_address ?? null,
            round: Number(match.round),
          })),
        }
      : undefined,
  };
};

export interface MoveChampionshipRPC {
  id: { id: string };
  title: string;
  description: string;
  game_name: string;
  ticket_price: string;
  reward_pool: string;
  date_start: string;
  admin: {
    fields: {
      address: string;
      discord_nickname: string;
    };
  };
  discord_chat_link: string;
  team_size: string;
  teams_limit: number;
  winners_amount: number;
  teams: {
    fields: MoveTeam;
  }[];
  sponsors: {
    fields: MoveSponsor;
  }[];
  bracket?: {
    fields: {
      current_round: string;
      matches: {
        fields: {
          team_a: {
            fields: MoveTeam;
          };
          team_b: {
            fields: MoveTeam;
          };
          winner_leader_address: string | null;
          round: string;
        };
      }[];
    };
  };
  status: number;
}

export const mapChampionshipRPC = (item: MoveChampionshipRPC): Championship => {
  return {
    id: item.id.id,
    title: item.title,
    description: item.description,
    gameName: item.game_name,
    dateStart: Number(item.date_start),
    ticketPrice: Number(item.ticket_price),
    rewardPool: {
      value: Number(item.reward_pool),
    },
    status: Number(item.status),
    teamSize: Number(item.team_size),
    participantsLimit: Number(item.teams_limit),
    discordLink: item.discord_chat_link,
    winnersAmount: Number(item.winners_amount),
    admin: {
      address: item.admin.fields.address,
      nickname: item.admin.fields.discord_nickname,
    },
    teams: item.teams.map(({ fields }) => mapTeam(fields)),
    sponsors: item.sponsors.map(({ fields }) => mapSponsor(fields)),
    bracket: item.bracket
      ? {
          currentRound: Number(item.bracket.fields.current_round),
          matches: item.bracket.fields.matches.map(({ fields }) => ({
            teamA: mapTeam(fields.team_a.fields),
            teamB: mapTeam(fields.team_b.fields),
            winnerLeaderAddress: fields.winner_leader_address ?? null,
            round: Number(fields.round),
          })),
        }
      : undefined,
  };
};
