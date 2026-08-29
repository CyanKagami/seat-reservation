import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({request }) => {
    let data = await request.formData()
    console.log(data)
    return json(
        {
            statusCode: 200,
            body: {
                "message": "OK"
            }
        }
    )
}