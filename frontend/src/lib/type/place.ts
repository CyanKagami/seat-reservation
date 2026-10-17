import type { CampusLocation } from "./location";
export interface Place {
    placeId: string;
    name: string;
    location: CampusLocation;
    description: string;
    creatorId: string;
    creatorName: string;
    picture: string;
    layoutURL: string;
}