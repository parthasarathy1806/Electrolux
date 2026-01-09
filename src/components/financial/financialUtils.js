import dayjs from "dayjs";

/**
 * Start date comes as ISO string from CustomDatePicker
 * Example: "2025-01-14T00:00:00.000Z"
 */

/* Generate rolling 12–13 month window */
export function generateMonths(startDateIso) {
  if (!startDateIso) return [];

  const start = dayjs(startDateIso);
  if (!start.isValid()) return [];

  // 🔑 Project lasts exactly 12 months = 365 days
  const end = start.add(1, "year").subtract(1, "day");

  const months = [];
  let cursor = start.startOf("month");

  while (
    cursor.isBefore(end, "month") ||
    cursor.isSame(end, "month")
  ) {
    months.push(cursor);
    cursor = cursor.add(1, "month");
  }

  return months;
}



/* Prorate units by active days in first & last month */
export function prorateUnits(units, month, startDateIso) {
  if (!startDateIso || !units) return 0;

  const start = dayjs(startDateIso);
  const end = start.add(1, "year").subtract(1, "day");

  const daysInMonth = month.daysInMonth();

  // First month
  if (month.isSame(start, "month")) {
    const activeDays = daysInMonth - start.date() + 1;
    return (units * activeDays) / daysInMonth;
  }

  // Last month (can be 12th or 13th)
  if (month.isSame(end, "month")) {
    const activeDays = end.date();
    return (units * activeDays) / daysInMonth;
  }

  return units;
}



/* Calculate monthly savings */
export function calculateMonthlySavings(units, unitCost) {
  if (!units || !unitCost) return 0;
  return units * unitCost;
}

/* Sum yearly totals */
export function sumByYear(monthlyMap) {
  const yearly = {};

  Object.entries(monthlyMap).forEach(([ym, value]) => {
    const year = ym.split("-")[0];
    yearly[year] = (yearly[year] || 0) + value;
  });

  return yearly;
}

/* Fixed cost split across months (with proration) */
export function splitFixedCost(annualTotal, months, startDateIso) {
  if (!annualTotal || !months.length) return {};

  const start = dayjs(startDateIso);
  const end = start.add(1, "year").subtract(1, "day");

  const totalDays = months.reduce((sum, m) => {
    if (m.isSame(start, "month")) {
      return sum + (m.daysInMonth() - start.date() + 1);
    }
    if (m.isSame(end, "month")) {
      return sum + end.date();
    }
    return sum + m.daysInMonth();
  }, 0);

  const result = {};

  months.forEach((m) => {
    let activeDays = m.daysInMonth();

    if (m.isSame(start, "month")) {
      activeDays = m.daysInMonth() - start.date() + 1;
    } else if (m.isSame(end, "month")) {
      activeDays = end.date();
    }

    result[m.format("YYYY-MM")] =
      (annualTotal * activeDays) / totalDays;
  });

  return result;
}


