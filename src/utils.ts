export const calculateDiscount = (price: number, percentage: number) => {
  return price * (percentage / 100);
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
