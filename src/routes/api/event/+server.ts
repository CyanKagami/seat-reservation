import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, createBucket } from "$lib/scripts/s3";
import { addData } from "$lib/scripts/dynamo";
import type { Event } from "$lib/type/event";
import { userStore } from "$lib/store/auth.svelte";

interface EventFormData {
    name: string,
    place: string,
    detail: string,
    condition: string,
    start: string,
    end: string,
    'register-date-start': string,
    'register-date-end': string,
    img?: File,
    timetable? : string,
    host:string
}

function formatData(data:EventFormData): Event {
    let event:Event = {
        date: {},
        "register-date": {}
    } as Event

    event.date.start = data.start
    event.date.end = data.end
    event["register-date"].start = data["register-date-start"]
    event["register-date"].end = data["register-date-end"]
    event.host = data.host

    event.name = data.name
    event.place = data.place
    event.detail = data.detail
    if (data.timetable) event.timetable = JSON.parse(data.timetable)
    event.condition = data.condition

    return event
}

export const POST: RequestHandler = async ({request }) => {
    let data:EventFormData = Object.fromEntries(await request.formData()) as unknown as EventFormData
    let processData:Event = {} as Event
    console.log(data)
    let picture = data.img as File
    if (picture)
    {
        let pictureBuffer = Buffer.from(await picture.arrayBuffer())
        processData.picture = await addFile("k-seat-event-picture", picture.name, pictureBuffer);
    }
    delete data.img
    processData = {
        ...processData,
        ...formatData(data)
    }
    console.log(processData)
    addData("events", processData)
    return json(
        {
            statusCode: 200,
            body: {
                "message": "OK"
            }
        }
    )
}