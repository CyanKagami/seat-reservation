// src/routes/api/location/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { guard } from '$lib/scripts/server/guard';
import { fetchAllData } from '$lib/scripts/server/dynamo';
 
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

// GET /api/location - list all locations
export const GET: RequestHandler = async (event) => {
    const user = await guard(event, ['admin']);
    if (user instanceof Response) return user;
    
    const data = Object.entries(FACULTY_MAP).map(([locationId, name]) => ({
        locationId,
        name
    }));
    return json({ body: { data } });
};
 