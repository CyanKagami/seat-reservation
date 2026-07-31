export interface Event {
    picture:string,
    name:string,
    date:{
        start:{
            day:string,
            month:string,
            year:string,
            time:string
        },
        end:{
            day:string,
            month:string,
            year:string,
            time:string
        }
    },
    place:string,
    host:string,
    detail:string,
    timetable: {
        start:string,
        end:string,
        activity:string
    }[],
    "register-date":string,
    condition?:string
}