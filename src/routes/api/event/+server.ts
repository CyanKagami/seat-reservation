import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, createBucket } from "$lib/scripts/s3";
import { addData } from "$lib/scripts/dynamo";
import { readFile } from "node:fs";

export const POST: RequestHandler = async ({request }) => {
    let data = await request.formData()
    console.log(data)
    let picture = data.get("img") as File
    if (picture)
    {
        let pictureBuffer = Buffer.from(await picture.arrayBuffer())
        addFile("k-seat-event-picture", picture.name, pictureBuffer)
    }
    return json(
        {
            statusCode: 200,
            body: {
                "message": "OK"
            }
        }
    )
}