import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, createBucket } from "$lib/scripts/s3";
import { addDataUniqueId, fetchAllData, fetchData, updateAllAttributes } from "$lib/scripts/dynamo";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { verifyAccess } from "$lib/scripts/authorization";
import type { User } from "$lib/type/user";
import { request } from "node:http";
import type { Place } from "$lib/type/place";
import path from "node:path";
import { v4 as uuid4} from "uuid";
import { encode } from "@msgpack/msgpack";

export const GET: RequestHandler = async ({request, cookies}) => {
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";

    // Verify the token signature
    const decoded:User = jwt.verify(token, JWT_SECRET) as User;
    if (!(await verifyAccess(decoded, ['admin']))) {
        return json(
            {
                statusCode: 403,
                body: { error: "Access denied" }
            }
        );
    }

    try {
        let data = await fetchAllData("places");
        console.log("Fetched data from 'places' table:", data);
        return json(
            {
                statusCode: 200,
                body: { data }
            }
        )
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return json(
            {
                statusCode: 500,
                body: { error: "Internal server error" }
            }
        );
    }
}

interface PlaceFormData {
    placeId?: string;
    name: string;
    location: string;
    description?: string;
    creatorId?: string;
    creatorName?: string;
    picture?: File;
    layoutURL?: string;
}


async function formatData(data:PlaceFormData, creator:User) {
    let place:Place = {
        placeId:data.placeId,
        creatorId:creator.googleId,
        creatorName: creator.name,
        description:data.description,
        name: data.name,
        location: await fetchData('locations', {locationId: data.location}),
    } as Place

    return place
}

export const POST: RequestHandler = async ({request, cookies}) => {
    // Doing some verify
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";

    // Verify the token signature
    const decoded:User = jwt.verify(token, JWT_SECRET) as User;
    if (!(await verifyAccess(decoded, ['admin']))) {
        return json(
            {
                statusCode: 403,
                body: { error: "Access denied" }
            }
        );
    }

    let formData = await request.formData();
    let location = await fetchData('locations', {locationId: formData.get('location')})
    let picture = formData.get('picture') as File
    let pictureURL = '';
    if (picture)
    {
        let pictureBuffer = Buffer.from(await picture.arrayBuffer())
        pictureURL = await addFile("k-seat-place-picture", `${Date.now()}-${uuid4()}${path.extname(picture.name)}` || 'Unknown', pictureBuffer);
    }

    let uniqueId = await addDataUniqueId("places", {
        name:formData.get('name'),
        picture: pictureURL,
        location: location,
        creatorId: decoded.googleId,
        creatorName: decoded.name
    }, 'placeId');

    const initialLayout = {
        version: "1.0",
        timestamp: new Date().toISOString(),
            canvas: {
                gridWidth: 80,
                gridHeight: 80,
            },

            objects: []
    };
    let msgpack = encode(initialLayout);
    
    await addFile("k-seat-place-layout", `${uniqueId}.msgpack`, Buffer.from(msgpack));

    return json({status:200, body: {message:"ok"}})
}

export const PATCH: RequestHandler = async ({request, cookies}) => {
        // Doing some verify
    const token = request.headers.get('Authorization')?.split(" ")[1] || cookies.get('user_session') || "";

    // Verify the token signature
    const decoded:User = jwt.verify(token, JWT_SECRET) as User;
    if (!(await verifyAccess(decoded, ['admin']))) {
        return json(
            {
                statusCode: 403,
                body: { error: "Access denied" }
            }
        );
    }

    let data:PlaceFormData = Object.fromEntries(await request.formData()) as unknown as PlaceFormData
    let processData:Place = {} as Place
    console.log('processData: ',data)
    let picture = data.picture as File
    if (picture)
    {
        let pictureBuffer = Buffer.from(await picture.arrayBuffer())
        processData.picture = await addFile("k-seat-place-picture", `${data.placeId}${path.extname(picture.name)}` || 'Unknown', pictureBuffer);
    }
    delete data.picture
    processData = {
        ...processData,
        ...(await formatData(data, decoded))
    }
    console.log(processData)
    await updateAllAttributes("places", {placeId: processData.placeId}, processData)
    return json(
        {
            body: {
                "message": "OK"
            }
        },
        {
            status:200
        }
    )
}