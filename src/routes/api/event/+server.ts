import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, createBucket } from "$lib/scripts/s3";
import { addData } from "$lib/scripts/dynamo";
import type { Event } from "$lib/type/event";

export const POST: RequestHandler = async ({request }) => {
    let data = await request.formData()
    let processData:Event = {} as Event
    console.log(data)

    let picture = data.get("img") as File
    if (picture)
    {
        let pictureBuffer = Buffer.from(await picture.arrayBuffer())
        processData.picture = await addFile("k-seat-event-picture", picture.name, pictureBuffer);
    }
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