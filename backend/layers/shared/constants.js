// layers/shared/constants.js

export const FACULTY_MAP = {
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

export function getLocation(locationId) {
  if (!locationId) return null;
  const id = typeof locationId === 'object' ? locationId.locationId : String(locationId);
  return {
    locationId: id,
    name: FACULTY_MAP[id] || id
  };
}

export function getAllLocations() {
  return Object.entries(FACULTY_MAP).map(([locationId, name]) => ({
    locationId,
    name
  }));
}
