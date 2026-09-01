export interface Event {
    picture:string,
    name:string,
    date:{
        start:string,
        end:string
    },
    place:string,
    host:string,
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