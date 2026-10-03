import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DISPLAY_TIMEZONE = 'Asia/Shanghai';

export function stringDateFormat(date: string) {
  return dayjs(date).tz(DISPLAY_TIMEZONE).format('YYYY-MM-DD');
}
