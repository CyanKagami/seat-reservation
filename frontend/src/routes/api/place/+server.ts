// /api/place/+server.ts
import { json, type RequestHandler } from "@sveltejs/kit";
import { addFile, deleteFile, deleteObjectsWithPrefix, getObjectURL } from "$lib/scripts/server/s3";
import { addDataUniqueId, deleteItem, fetchAllData, fetchData, updateAllAttributes } from "$lib/scripts/server/dynamo";
import type { User } from "$lib/type/user";
import type { Place } from "$lib/type/place";
import path from "node:path";
import { v4 as uuid4} from "uuid";
import { encode } from "@msgpack/msgpack";
import { guard } from "$lib/scripts/server/guard";
import { convertToWebp } from "$lib/scripts/server/utils";

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


const FACULTY_MAP: Record<string, string> = {
  '01': 'คณะวิศวกรรมศาสตร์',
  '02': 'คณะสถาปัตยกรรม ศิลปะและการออกแบบ',
  '03': 'คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี',
  '04': 'คณะเทคโนโลยีการเกษตร',
  '05': 'คณะวิทยาศาสตร์',
  '06': 'คณะอุตสาหกรรมอาหาร',
  '07': 'คณะเทคโนโลยีสารสนเทศ',
  '08': 'คณะบริหารธุรกิจ',
  '09': 'คณะศิลปศาสตร์',
  '10': 'วิทยาลัยเทคโนโลยีและนวัตกรรมวัสดุ',
  '11': 'วิทยาลัยนวัตกรรมการผลิตขั้นสูง',
  '12': 'วิทยาลัยอุตสาหกรรมการบินนานาชาติ',
  '13': 'คณะแพทยศาสตร์',
  '14': 'คณะทันตแพทยศาสตร์',
  '15': 'คณะพยาบาลศาสตร์',
  '31': 'วิทยาเขตชุมพรเขตอุดมศักดิ์',
};

function getLocation(locationId?: string) {
    if (!locationId) return null;
    return {
        locationId,
        name: FACULTY_MAP[locationId] || locationId
    };
}

async function formatData(data:PlaceFormData, creator:User) {
    let place:Place = {
        placeId:data.placeId,
        creatorId:creator.email,
        creatorName: creator.name,
        description:data.description,
        name: data.name,
        location: getLocation(data.location),
    } as Place

    return place
}

export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['admin', 'organizer']);
    if (user instanceof Response) return user;
    
    try {
        const data = await fetchAllData('places');
        return json({ body: { data } });
    } catch (error) {
        console.error('Error fetching places:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}


export const POST: RequestHandler = async (event) => {
  const user = await guard(event, ['admin']);
  if (user instanceof Response) return user;
 
  try {
    const formData = await event.request.formData();
    const location = getLocation(formData.get('location') as string);
    const picture = formData.get('picture') as File | null;

 
    const uniqueId = await addDataUniqueId(
      'places',
      {
        name: formData.get('name'),
        location,
        creatorId: user.email,
        creatorName: user.name
      },
      'placeId',
      (id) => {
        if (picture && picture.size > 0) return {picture:getObjectURL('pictures/place',`${id}.webp`)}
        return {}
      }
    );

    if (picture && picture.size > 0) {
      const buffer = await convertToWebp(Buffer.from(await picture.arrayBuffer()));
      await addFile(
        `pictures/place`,`${uniqueId}.webp`,
        buffer
      );
    }
 
    const initialLayout = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      canvas: { gridWidth: 80, gridHeight: 80 },
      objects: []
    };
    await addFile(`layouts/place/${uniqueId}`,`layout.msgpack`, Buffer.from(encode(initialLayout)));
 
    return json({ body: { message: 'ok', placeId: uniqueId } });
  } catch (error) {
    console.error('Error creating place:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PATCH: RequestHandler = async (event) => {
  const user = await guard(event, ['admin']);
  if (user instanceof Response) return user;
 
  try {
    const data = Object.fromEntries(await event.request.formData()) as unknown as PlaceFormData;
    const processData = {} as Place;
 
    const picture = data.picture;
    if (picture && picture.size > 0) {
      const buffer = await convertToWebp(Buffer.from(await picture.arrayBuffer()));
      processData.picture = await addFile(
        `pictures/place`,`${data.placeId}.webp`,
        buffer
      );
    }
    delete data.picture;
 
    Object.assign(processData, await formatData(data, user));
    await updateAllAttributes('places', { placeId: processData.placeId }, processData);
 
    return json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error updating place:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async (event) => {
  const user = await guard(event, ['admin', 'organizer']);
  if (user instanceof Response) return user;

  const placeId = event.url.searchParams.get('places');
  if (!placeId) return json({ error: 'Missing placeId' }, { status: 400 });

  try {
    let placeData = await fetchData('places', {placeId}) as Place;
    await deleteItem('places', { placeId });
    await deleteFile('pictures/place',placeData.picture);
    await deleteObjectsWithPrefix(`layouts/place/${placeId}`);
    return json({ body: { message: 'OK' } });
  } catch (error) {
    console.error('Error deleting place:', error);
    return json({ error: 'Internal Server Error'  }, { status: 500 });
  }
};