import type { Place } from "./place"

export interface Event {
    picture:string,
    name:string,
    date:{
        start:string,
        end:string
    },
    place:Place,
    host:string,
    creatorId:string,
    detail:string,
    timetable:Daytable[],
    "register-date":{
        start:string,
        end:string
    },
    condition?:string,
    eventId:string
}

export interface Daytable {
        date: string
        activity:{
            start:string,
            end:string,
            activity:string
        }[]
}