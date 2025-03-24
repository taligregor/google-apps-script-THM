function calculateVesatot() {
  const calendarName = "טה\"מ";
  const periodEventTitles = ["ר.ד.ב.", "ר.ד.ע."];
  const processedMarkerOwn = "Processed: Own Interval";
  const processedMarkerPrev = "Processed: Previous Interval";
  const calendar = CalendarApp.getCalendarsByName(calendarName);

  if (!calendar || calendar.length === 0) {
    Logger.log(`Calendar "${calendarName}" not found.`);
    return;
  }

  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  Logger.log(`Fetching events from ${twoMonthsAgo} to ${now}.`);

  let events = calendar[0].getEvents(twoMonthsAgo, now)
    .filter(event => periodEventTitles.some(title => event.getTitle().toLowerCase() === title.toLowerCase()));

  Logger.log(`Filtered events: ${events.length}`);

  // Sort events by start time
  events.sort((a, b) => a.getStartTime() - b.getStartTime());
  Logger.log("Sorted events by start time.");

  // Process Hefsek events
  const hefsekEvents = calendar[0].getEvents(twoMonthsAgo, now).filter(event => event.getTitle() === "ה.ט.");
  hefsekEvents.forEach(event => {
    if (!event.getDescription() || !event.getDescription().includes(processedMarkerOwn)) {
      // Subtract an hour from the Hefsek event time *before* adjusting to the Halachic day
      const hefsekTime = new Date(event.getStartTime());
      hefsekTime.setHours(hefsekTime.getHours() - 1);
      const hefsekDate = adjustToHalachicDay(hefsekTime, event.getTitle());

      // *Corrected Tevila Calculation*
      const tavilaDate = new Date(hefsekTime); // Use the original hefsekTime
      tavilaDate.setDate(tavilaDate.getDate() + 7);

      addHefsekReminders(calendar, "ל.ט.", tavilaDate, true);

      event.setDescription(`${event.getDescription() || ""}\n${processedMarkerOwn}`);
      Logger.log(`Added events for Hefsek and marked as processed. Event ID: ${event.getId()}`);
    } else {
      Logger.log(`Hefsek event already processed. Event ID: ${event.getId()}`);
    }
  });

  // Process Vesatot events
  if (events.length > 0) {
    events.forEach((event, index, eventsArray) => {
      const eventStart = adjustToHalachicDay(event.getStartTime(), event.getTitle());
      Logger.log(`Processing event: ${event.getTitle()} on ${eventStart}. Event ID: ${event.getId()}`);
      const eventTitle = event.getTitle().toLowerCase();
      const originalStartTime = eventTitle.includes("am") ? "AM" : "PM";
      const vesetTime = originalStartTime === "AM" ? 6 : 18;

      if (!(eventStart instanceof Date) || isNaN(eventStart)) {
        Logger.log(`Error: Invalid eventStart passed to calculateAndAddEvents: ${eventStart}`);
        throw new Error(`Invalid eventStart: ${eventStart}`);
      }

      if (!event.getDescription() || !event.getDescription().includes(processedMarkerOwn)) {
        calculateAndAddEvents(eventStart, vesetTime, calendar);
        event.setDescription(`${event.getDescription() || ""}\n${processedMarkerOwn}`);
        Logger.log(`Added events for own interval and marked as processed. Event ID: ${event.getId()}`);
      } else {
        Logger.log(`Event already processed. Event ID: ${event.getId()}`);
      }

      if (index > 0 && (!eventsArray[index - 1].getDescription() || !eventsArray[index - 1].getDescription().includes(processedMarkerPrev))) {
        const prevEventStart = adjustToHalachicDay(eventsArray[index - 1].getStartTime(), eventsArray[index - 1].getTitle());
        const intervalDays = (eventStart - prevEventStart) / (1000 * 60 * 60 * 24);
        Logger.log(`Interval days between events: ${intervalDays}`);
        const vesetHaHaflaga = new Date(eventStart);
        vesetHaHaflaga.setDate(vesetHaHaflaga.getDate() + intervalDays);

        addEventWithReminders(calendar, "הפ.", vesetHaHaflaga, vesetTime);

        eventsArray[index - 1].setDescription(`${eventsArray[index - 1].getDescription() || ""}\n${processedMarkerPrev}`);
        Logger.log(`Added וסת הפלגה event and marked PREVIOUS interval as processed. Event ID: ${eventsArray[index - 1].getId()}`);
      } else if (index > 0) {
        Logger.log(`Previous event already processed. Event ID: ${eventsArray[index - 1].getId()}`);
      }

      // Calculate Yom Hachodesh for the last event
      if (index === eventsArray.length - 1) {
        const yomHachodesh = calculateYomHachodesh(eventStart);
        const hebrewYomHachodesh = getHebrewDate(yomHachodesh);

        let onahBeinonitDay;
        const vesetHaBeinonitDay1 = new Date(eventStart);
        vesetHaBeinonitDay1.setDate(vesetHaBeinonitDay1.getDate() + 29);
        const vesetHaBeinonitDay2 = new Date(eventStart);
        vesetHaBeinonitDay2.setDate(vesetHaBeinonitDay2.getDate() + 30);

        if (yomHachodesh.getTime() === vesetHaBeinonitDay1.getTime()) {
          onahBeinonitDay = vesetHaBeinonitDay1;
        } else if (yomHachodesh.getTime() === vesetHaBeinonitDay2.getTime()) {
          onahBeinonitDay = vesetHaBeinonitDay2;
        } else if (hebrewYomHachodesh.day === 30) {
          onahBeinonitDay = vesetHaBeinonitDay2;
        } else {
          Logger.log(`Error: Yom Hachodesh ${yomHachodesh} does not fall on either Ona Beinonit day.`);
          return;
        }

        addEventWithReminders(calendar, `ע.ב., יה"ח`, onahBeinonitDay, vesetTime);
      }
    });
  }

  Logger.log("Vesatot events and reminders added to the calendar.");
}

function calculateAndAddEvents(eventStart, vesetTime, calendar) {
  if (!(eventStart instanceof Date) || isNaN(eventStart)) {
    Logger.log(`Error: Invalid eventStart passed to calculateAndAddEvents: ${eventStart}`);
    throw new Error(`Invalid eventStart: ${eventStart}`);
  }

  Logger.log(`Calculating events based on start date: ${eventStart}`);

  // Calculate Ona Beinonit days
  const vesetHaBeinonitDay1 = new Date(eventStart);
  vesetHaBeinonitDay1.setDate(vesetHaBeinonitDay1.getDate() + 29);
  const vesetHaBeinonitDay2 = new Date(eventStart);
  vesetHaBeinonitDay2.setDate(vesetHaBeinonitDay2.getDate() + 30);

  // Calculate Yom Hachodesh
  const yomHachodesh = calculateYomHachodesh(eventStart);

  // Check for existing Ona Beinonit events before adding new ones
  const existingOna1 = calendar[0].getEvents(vesetHaBeinonitDay1, new Date(vesetHaBeinonitDay1.getFullYear(), vesetHaBeinonitDay1.getMonth(), vesetHaBeinonitDay1.getDate(), 23, 59, 59))
                                  .filter(e => e.getTitle().includes("ע.ב."));
  const existingOna2 = calendar[0].getEvents(vesetHaBeinonitDay2, new Date(vesetHaBeinonitDay2.getFullYear(), vesetHaBeinonitDay2.getMonth(), vesetHaBeinonitDay2.getDate(), 23, 59, 59))
                                  .filter(e => e.getTitle().includes("ע.ב."));

  // Determine which Ona Beinonit day Yom Hachodesh falls on and combine them, only if events don't already exist
  if (yomHachodesh.getTime() === vesetHaBeinonitDay1.getTime() && existingOna1.length === 0) {
    addEventWithReminders(calendar, `ע.ב., יה"ח`, vesetHaBeinonitDay1, vesetTime);
    if (existingOna2.length === 0) {
      addEventWithReminders(calendar, "ע.ב.", vesetHaBeinonitDay2, vesetTime);
    }
  } else if (yomHachodesh.getTime() === vesetHaBeinonitDay2.getTime() && existingOna2.length === 0) {
    addEventWithReminders(calendar, `ע.ב., יה"ח`, vesetHaBeinonitDay2, vesetTime);
    if (existingOna1.length === 0) {
      addEventWithReminders(calendar, "ע.ב.", vesetHaBeinonitDay1, vesetTime);
    }
  } else if (existingOna1.length === 0 && existingOna2.length === 0) {
    // This case should never happen, but handle it for completeness
    Logger.log(`Error: Yom Hachodesh ${yomHachodesh} does not fall on either Ona Beinonit day.`);
    addEventWithReminders(calendar, "ע.ב.", vesetHaBeinonitDay1, vesetTime);
    addEventWithReminders(calendar, "ע.ב.", vesetHaBeinonitDay2, vesetTime);
  } else {
    Logger.log(`Ona Beinonit events already exist for ${eventStart}. Skipping creation.`);
  }

  const hafsakaDate = new Date(eventStart);
  hafsakaDate.setDate(hafsakaDate.getDate() + 5);

  if (!(hafsakaDate instanceof Date) || isNaN(hafsakaDate)) {
    Logger.log(`Error: Invalid hafsakaDate calculated from eventStart: ${eventStart}`);
    throw new Error(`Invalid hafsakaDate: ${hafsakaDate}`);
  }

  Logger.log(`Calculated hafsakaDate: ${hafsakaDate}`);

  // Add Hefsek Tahara event with question mark
  addHefsekReminders(calendar, "ה.ט.?", hafsakaDate);
}

function addEventWithReminders(calendar, title, date, vesetTime) {
  Logger.log(`Creating event: ${title} on ${date} at ${vesetTime}:00`);
  const sunsetTime = fetchAstronomicalSunset(date);
  Logger.log(`Calculated sunset time: ${sunsetTime}`);

  const eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), vesetTime);
  const eventEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), vesetTime + 1);

  const existingEvents = calendar[0].getEvents(eventStart, eventEnd).filter(e => e.getTitle().includes(title));

  if (existingEvents.length > 0) {
    let combinedTitle = existingEvents[0].getTitle();
    if (!combinedTitle.includes(title)) {
      combinedTitle += `, ${title}`;
    }
    existingEvents[0].setTitle(combinedTitle);
    Logger.log(`Combined event: ${combinedTitle}`);
    return;
  }

  const newEvent = calendar[0].createEvent(title, eventStart, eventEnd);
  Logger.log(`Created event: ${title} at ${eventStart}`);

  if (title.includes("ע.ב.")) { // Check if the title includes "ע.ב."
    const onahShekia = fetchAstronomicalSunset(date);
    if (eventStart < onahShekia) {
      const reminder = new Date(onahShekia);
      reminder.setMinutes(reminder.getMinutes() - 20);
      newEvent.addPopupReminder(Math.max((onahShekia - eventStart) / (1000 * 60) - 20, 0));
      Logger.log(`Added daytime reminder for עונה בינונית 20 minutes before shekia: ${reminder}`);
    } else {
      const morningReminderTime = new Date(date);
      morningReminderTime.setHours(7, 0, 0, 0);
      const minutesBeforeShekia = (onahShekia - morningReminderTime) / (1000 * 60);
      newEvent.addPopupReminder(minutesBeforeShekia);
      Logger.log(`Added reminder for עונה בינונית at 7 AM the same morning: ${minutesBeforeShekia} minutes before shekia`);
    }
  }
}

function addHefsekReminders(calendar, title, date, isTavila = false) {
  Logger.log(`addHefsekReminders called with date: ${date}`);
  let sunsetTime;
  try {
    sunsetTime = fetchAstronomicalSunset(date);
    Logger.log(`Calculated sunset time for ${title}: ${sunsetTime}`);
  } catch (error) {
    Logger.log(`Error fetching sunset time: ${error.message}`);
    return;
  }

  let eventStart = new Date(sunsetTime); // Start at sunset
  if (isTavila) {
    eventStart.setMinutes(eventStart.getMinutes() + 20); // Add 20 minutes for Tevila
  }
  const eventEnd = new Date(eventStart);
  eventEnd.setHours(eventStart.getHours() + 1);

  const existingEvents = calendar[0].getEvents(eventStart, eventEnd).filter(e => e.getTitle() === title);
  if (existingEvents.length > 0) {
    Logger.log(`Event with title "${title}" already exists on ${eventStart}. Skipping creation.`);
    return;
  }

  const newEvent = calendar[0].createEvent(title, eventStart, eventEnd);
  Logger.log(`Created event: ${title} at ${eventStart}`);

  if (title.includes("ע.ב.")) { // Check if the title includes "ע.ב."
    const onahShekia = fetchAstronomicalSunset(date);
    if (eventStart < onahShekia) {
      const reminder = new Date(onahShekia);
      reminder.setMinutes(reminder.getMinutes() - 20);
      newEvent.addPopupReminder(Math.max((onahShekia - eventStart) / (1000 * 60) - 20, 0));
      Logger.log(`Added daytime reminder for עונה בינונית 20 minutes before shekia: ${reminder}`);
    } else {
      const morningReminderTime = new Date(date);
      morningReminderTime.setHours(7, 0, 0, 0);
      const minutesBeforeShekia = (onahShekia - morningReminderTime) / (1000 * 60);
      newEvent.addPopupReminder(minutesBeforeShekia);
      Logger.log(`Added reminder for עונה בינונית at 7 AM the same morning: ${minutesBeforeShekia} minutes before shekia`);
    }
  }
}

function fetchAstronomicalSunset(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    Logger.log(`Error: Invalid date argument passed to fetchAstronomicalSunset: ${date}`);
    throw new Error(`Invalid date argument passed to fetchAstronomicalSunset: ${date}`);
  }

  const SUNSET_API = "https://api.sunrise-sunset.org/json";
  const JERUSALEM_LAT = 31.7683;
  const JERUSALEM_LNG = 35.2137;

  const formattedDate = Utilities.formatDate(date, "Jerusalem", "yyyy-MM-dd");
  const formattedDateTime = Utilities.formatDate(date, "Jerusalem", "yyyy-MM-dd HH:mm");

  Logger.log(`Fetching sunset time for date: ${formattedDateTime}`);
  const response = UrlFetchApp.fetch(`${SUNSET_API}?lat=${JERUSALEM_LAT}&lng=${JERUSALEM_LNG}&date=${formattedDate}&formatted=0`);
  const data = JSON.parse(response.getContentText());

  if (data.status === "OK") {
    const sunsetLocal = new Date(data.results.sunset);
    Logger.log(`Fetched sunset time (local): ${sunsetLocal}`);
    return sunsetLocal;
  } else {
    Logger.log(`Error fetching sunset time: ${JSON.stringify(data)}`);
    throw new Error("Failed to fetch sunset time from API.");
  }
}


function calculateYomHachodesh(date) {
  Logger.log(`Calculating יומ החודש for: ${date}`);
  const hebrewDate = getHebrewDate(date);
  Logger.log(`**Hebrew date: ${hebrewDate.day} ${hebrewDate.month} ${hebrewDate.year}`);

  // Get the number of days in the current Hebrew month
  const daysInMonth = getDaysInHebrewMonth(hebrewDate.year, hebrewDate.month);
  Logger.log(`days in month: ${daysInMonth}`);

  // Increment the Gregorian date by the number of days in the month
  const yomHachodesh = new Date(date);
  yomHachodesh.setDate(yomHachodesh.getDate() + daysInMonth);

  const hebrewYomHachodesh = getHebrewDate(yomHachodesh);
  Logger.log(`Calculated Yom Hachodesh: ${hebrewYomHachodesh.day} ${hebrewYomHachodesh.month} ${hebrewYomHachodesh.year}`);

  return yomHachodesh;
}

function getDaysInHebrewMonth(year, month) {
  const day29 = getGregorianDateForHebrew(year, month, 29);

  if (day29) {
    // If the 29th exists, try the 30th.
    try {
      const day30 = getGregorianDateForHebrew(year, month, 30);
      if (day30) {
        return 30;
      } else {
        return 29;
      }
    } catch (error) {
      // Handle the error (e.g., log it, return 29)
      console.error("Error getting Gregorian date for day 30:", error);
      return 29; // Assume it's a 29-day month in case of error
    }
  } else {
    console.error("Error getting Gregorian date for day 29.");
    return 0; // Or throw an error, depending on how you want to handle it.
  }
}

function getHebrewDate(gregorianDate) {
  const HEBREW_DATE_API = "https://www.hebcal.com/converter";
  const formattedDate = Utilities.formatDate(gregorianDate, "GMT", "yyyy-MM-dd");
  const response = UrlFetchApp.fetch(`${HEBREW_DATE_API}?cfg=json&gy=${gregorianDate.getFullYear()}&gm=${gregorianDate.getMonth() + 1}&gd=${gregorianDate.getDate()}&g2h=1`);
  const data = JSON.parse(response.getContentText());
 // Logger.log(`>>Hebrew date: Year ${year}, Month ${month}, Day ${day}`);
  return {
    day: data.hd,
    month: data.hm,
    year: data.hy
  };

}

function getGregorianDateForHebrew(year, month, day) {
  const HEBREW_DATE_API = "https://www.hebcal.com/converter";
  const response = UrlFetchApp.fetch(`${HEBREW_DATE_API}?cfg=json&hy=${year}&hm=${month}&hd=${day}&h2g=1`);
  const data = JSON.parse(response.getContentText());
  if (data.gy && data.gm && data.gd) {
    return new Date(data.gy, data.gm - 1, data.gd);
  }
  Logger.log(`Invalid Hebrew date: Year ${year}, Month ${month}, Day ${day}`);
  return null;
}

function adjustToHalachicDay(date, eventTitle) {
  Logger.log(`Adjusting to halachic day for: ${date}, event: ${eventTitle}`);
  const sunsetTime = fetchAstronomicalSunset(date);

  const adjustedDate = new Date(date);
  if (date > sunsetTime) {
    adjustedDate.setDate(date.getDate() + 1);
  }
  adjustedDate.setHours(0, 0, 0, 0);
  Logger.log(`Halachic day adjusted to: ${adjustedDate}`);
  return adjustedDate;
}

