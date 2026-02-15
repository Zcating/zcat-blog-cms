import dayjs from 'dayjs';

export function stringDateFormat(date: string) {
  return dayjs(date).format('YYYY-MM-DD');
}
