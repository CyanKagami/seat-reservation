/**
 * ฟังก์ชันแปลงช่วงวันที่และเวลาให้ออกมาเป็นภาษาไทยอ่านง่าย
 */
export function formatThaiDateTime(startDate:Date, endDate?:Date, showYear = true, showTime = true): string {
  const start = new Date(startDate);

  if (isNaN(start.getTime())) {
    throw new Error("Invalid startDate provided.");
  }

  // รูปแบบการแสดงวันที่ (เช่น 15 ม.ค. 2567 หรือ 15 มกราคม 2567)
  const dateFormatter = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: showYear ? 'numeric' : undefined,
  });

  // รูปแบบการแสดงเวลา (เช่น 09:30 น.)
  const timeFormatter = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedStartDate = dateFormatter.format(start);
  const formattedStartTime = `${timeFormatter.format(start)} น.`;

  // กรณีไม่มี endDate แสดงเฉพาะเวลาเริ่มต้น
  if (!endDate) {
    return `${formattedStartDate} เวลา ${formattedStartTime}`;
  }

  const end = new Date(endDate);
  if (isNaN(end.getTime())) {
    throw new Error("Invalid endDate provided.");
  }

  const formattedEndTime = `${timeFormatter.format(end)} น.`;
  const isSameDay = start.toDateString() === end.toDateString();

  // กรณีเป็นวันเดียวกัน: แสดงวันที่ครั้งเดียว แล้วตามด้วยช่วงเวลา
  if (isSameDay && showTime) {
    return `${formattedStartDate} เวลา ${formattedStartTime} - ${formattedEndTime}`;
  }
  if (isSameDay) {
    return `${formattedStartDate}`;
  }


  // กรณีคนละวัน: แสดงทั้งวันที่และเวลาของทั้งสองฝั่ง
  const formattedEndDate = dateFormatter.format(end);
  if (showTime)
    return `${formattedStartDate} เวลา ${formattedStartTime} - ${formattedEndDate} เวลา ${formattedEndTime}`;
  return `${formattedStartDate} - ${formattedEndDate}`;
}

export function formatThaiDateTimeShort(startDate:Date, endDate?:Date, showYear = true): string {
  const start = new Date(startDate);

  if (isNaN(start.getTime())) {
    throw new Error("Invalid startDate provided.");
  }

  // รูปแบบการแสดงวันที่ (เช่น 15 ม.ค. 2567 หรือ 15 มกราคม 2567)
  const dateFormatter = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: showYear ? 'numeric' : undefined,
  });

  // รูปแบบการแสดงเวลา (เช่น 09:30 น.)


  const formattedStartDate = dateFormatter.format(start);
  // กรณีไม่มี endDate แสดงเฉพาะเวลาเริ่มต้น
  if (!endDate) {
    return `${formattedStartDate}`;
  }

  const end = new Date(endDate);
  if (isNaN(end.getTime())) {
    throw new Error("Invalid endDate provided.");
  }

  const isSameDay = start.toDateString() === end.toDateString();

  // กรณีเป็นวันเดียวกัน: แสดงวันที่ครั้งเดียว
  if (isSameDay) {
    return `${formattedStartDate}`;
  }
  const formattedEndDate = dateFormatter.format(end);

  // กรณีคนละวัน แต่เดือนเดียวกัน ปีเดียวกัน แสดงเดือนและปีแค่ครั้งเดียว
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getDate()} - ${formattedEndDate}`
  }

    // กรณีคนละวัน: แสดงทั้งวันที่และเวลาของทั้งสองฝั่ง
  return `${formattedStartDate} - ${formattedEndDate}`;
}