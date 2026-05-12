function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  return `${year}-${month}-${day}`;
}

function getDateOffset(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return formatDate(date);
}

function getToday() {
  return getDateOffset(0);
}

function getMonthLabel(year, month) {
  return `${year}年${month}月`;
}

function getMonthDayCount(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthFirstWeekday(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

function getMonthKey(year, month) {
  return `${year}-${padNumber(month)}`;
}

function shiftMonth(year, month, offset) {
  const nextDate = new Date(year, month - 1 + offset, 1);

  return {
    year: nextDate.getFullYear(),
    month: nextDate.getMonth() + 1
  };
}

function getUniqueRecordDates(records) {
  return Array.from(
    new Set(
      records
        .map((record) => record.date)
        .filter(Boolean)
    )
  ).sort((left, right) => right.localeCompare(left));
}

function getConsecutiveDays(records) {
  const dates = getUniqueRecordDates(records);

  if (!dates.length) {
    return 0;
  }

  const today = getToday();
  if (!dates.includes(today)) {
    return 0;
  }

  let streak = 1;
  let cursor = new Date(`${today}T00:00:00`);
  const remainingDates = dates.filter((date) => date !== today);

  for (let index = 0; index < remainingDates.length; index += 1) {
    const expected = new Date(cursor);
    expected.setDate(expected.getDate() - 1);

    if (formatDate(expected) !== remainingDates[index]) {
      break;
    }

    streak += 1;
    cursor = expected;
  }

  return streak;
}

function getLongestConsecutiveDays(records) {
  const dates = getUniqueRecordDates(records).sort((left, right) => left.localeCompare(right));

  if (!dates.length) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = new Date(`${dates[index - 1]}T00:00:00`);
    previous.setDate(previous.getDate() + 1);

    if (formatDate(previous) === dates[index]) {
      current += 1;
      longest = Math.max(longest, current);
      continue;
    }

    current = 1;
  }

  return longest;
}

function getProjectStats(project, records) {
  const projectRecords = records.filter((record) => record.project_id === project.id);
  const uniqueDates = getUniqueRecordDates(projectRecords);
  const totalDays = uniqueDates.length;
  const checkedToday = uniqueDates.includes(getToday());
  const consecutiveDays = getConsecutiveDays(projectRecords);
  const longestConsecutiveDays = getLongestConsecutiveDays(projectRecords);
  const completionRate = project.target > 0 ? (totalDays / project.target) : 0;
  const progressPercent = Math.min(100, Math.round(completionRate * 100));

  return {
    checkedToday,
    consecutiveDays,
    completionRate,
    longestConsecutiveDays,
    totalDays,
    progressPercent
  };
}

function buildCalendarDays(year, month, checkedDates) {
  const today = getToday();
  const checkedDateSet = new Set(checkedDates);
  const firstWeekday = getMonthFirstWeekday(year, month);
  const currentMonthDayCount = getMonthDayCount(year, month);
  const previousMonth = shiftMonth(year, month, -1);
  const previousMonthDayCount = getMonthDayCount(previousMonth.year, previousMonth.month);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    let dayNumber = 0;
    let dayYear = year;
    let dayMonth = month;
    let isCurrentMonth = true;

    if (index < firstWeekday) {
      dayNumber = previousMonthDayCount - firstWeekday + index + 1;
      dayYear = previousMonth.year;
      dayMonth = previousMonth.month;
      isCurrentMonth = false;
    } else if (index >= firstWeekday + currentMonthDayCount) {
      const nextMonth = shiftMonth(year, month, 1);
      dayNumber = index - firstWeekday - currentMonthDayCount + 1;
      dayYear = nextMonth.year;
      dayMonth = nextMonth.month;
      isCurrentMonth = false;
    } else {
      dayNumber = index - firstWeekday + 1;
    }

    const dateText = `${dayYear}-${padNumber(dayMonth)}-${padNumber(dayNumber)}`;

    days.push({
      key: `${dateText}-${index}`,
      date: dateText,
      day: dayNumber,
      isCurrentMonth,
      isToday: dateText === today,
      isChecked: checkedDateSet.has(dateText)
    });
  }

  return days;
}

module.exports = {
  buildCalendarDays,
  formatDate,
  getDateOffset,
  getLongestConsecutiveDays,
  getMonthKey,
  getMonthLabel,
  getToday,
  getProjectStats,
  shiftMonth
};
