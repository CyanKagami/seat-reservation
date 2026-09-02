import type { User } from "./user";

export interface Place {
    placeId: string;
    name: string;
    location: string;
    description: string;
    creatorId: string;
    creatorName: string;
    picture: string;
    layoutURL: string;
}