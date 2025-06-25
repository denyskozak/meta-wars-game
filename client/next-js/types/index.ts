import React, { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Team {
  name: string;
  leaderAddress: string;
  leadNickname: string;
  teammateNicknames: string[];
}

export interface Sponsor {
  address: string;
  title: string;
  amount: number;
}

export interface Championship {
  id: string;
  title: string;
  description: string;
  gameName: string;
  dateStart: number;
  ticketPrice: number; // ticket_price
  rewardPool: {
    value: number;
  };
  status: number; // 0 = Open, 1 = Ongoing, 2 = Closed
  teamSize: number; // team_size
  participantsLimit: number; // teams_limit
  winnersAmount: number;
  discordLink: string; // discord_chat_link
  admin: {
    address: string;
    nickname: string;
  };
  teams: Team[];
  sponsors: Sponsor[];
  bracket?: {
    currentRound: number;
    matches: {
      teamA: Team;
      teamB: Team;
      winnerLeaderAddress: string | null;
      round: number;
    }[];
  };
}

export interface PlayerData {
  address: string;
  classType: string;
  character?: string;
}

export interface MatchDetail {
  id: string;
  name: string;
  players: Array<[string, PlayerData]>;
  maxPlayers: number;
  isFull: boolean;
}

export interface InterfaceAction {
  type: string;
  payload?: unknown;
}

export interface InterfaceContextValue {
  state: unknown;
  dispatch: React.Dispatch<InterfaceAction>;
}
