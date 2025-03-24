# google-apps-script-THM
Google Apps Script for calculating taharas hamishpacha events and automatically adding to google calendar

# Google Apps Script - Niddah Calendar Automation

This Google Apps Script automates the calculation and addition of events related to Jewish menstrual laws (Niddah) to a Google Calendar.

## Features

* Calculates and adds events for:
    * Hefsek Tahara
    * Tevila
    * Haflaga
    * Yom Hachodesh
    * Ona Beinonit (days 30 AND 31)
* Uses the sunrise-sunset.org API for sunset calculations, providing a reasonable estimation that is earlier than actual *shekia* in Jerusalem.
* Handles potential errors and logs them to the Google Apps Script execution log.
* All interaction with the script is via Google Calendar.
* The script is currently hard-coded for times in Jerusalem and using the minhag of צאת being exactly 20 minutes after שקיעה.

## How to Use

1.  **Prerequisites:**

    * A Google account.
    * A Google Calendar named "טה"מ".

2.  **Installation**

    * Copy the code from `calculateVesatot.gs`
    * In your Google Drive, create a new Google Apps Script.
    * Paste the code into the script editor.
    * Run the `calculateVesatot` function. You will need to authorize the script.
    * Set up a trigger to run the script automatically (e.g., daily).

3.  **Configuration**

    * The script assumes your calendar is named "טה"מ". You can change the `calendarName` variable in the code if needed.
    * The script uses "ר.ד.ב." and "ר.ד.ע." as titles for events indicating period start, ראיית דם בוקר, ראיית דם ערב. the woman adds these herself as calendar events. they can be all-day events.

## Assumptions and Customs

The script is designed to automate Niddah observance according to specific Halachic customs. Key assumptions include:

1.  **Calendar Name:** The script assumes the relevant calendar is named "טה"מ".

2.  **Period Event Titles:** The script uses "ר.ד.ב." and "ר.ד.ע." as titles for events indicating the start of a menstrual period.

3.  **Hefsek Tahara:**
    * The script looks for events titled "ה.ט." to identify days on which a woman performs a *Hefsek Tahara* (cessation check).
    * The script assumes the *Hefsek Tahara* event is set at sunset.
    * The script subtracts an hour from the *Hefsek* event time before calculating the *Tevila* date, to ensure the *Tevila* is set for the correct Friday night.

4.  **Tevila (Mikveh):**
    * The script calculates the *Tevila* date as 7 days after the *Hefsek Tahara*, following the requirement of *Shivah Neki'im* (seven clean days).
    * The *Tevila* event is scheduled for 20 minutes after sunset. This timing is based on the concept of *Tzeit Hakochavim* (nightfall) in Jerusalem.

        * *Tzeit Hakochavim* is the time when three medium stars are visible, marking the end of the day according to Halacha. There are varying opinions on the precise time, and 20 minutes after sunset is a common estimation in Jerusalem.

5.   **Haflaga:**
    * The script calculates the *Haflaga*, which is the interval between the start of two consecutive menstrual periods. This calculation is used to determine a potential time for the onset of the next period.
        * The script calculates the number of days between the start of the current period and the start of the previous period.
        * It then adds this interval to the start date of the current period to predict the *Haflaga*.
        * For example, if the previous period began on the 1st of the month, and the current period began on the 29th, the interval is 28 days. The script will add 28 days to the start date of the *current* period to calculate the date of the *Haflaga*.

6.  **Yom Hachodesh:**
    * The script calculates *Yom Hachodesh*, the day of the month in the Hebrew calendar.

7.  **Ona Beinonit:**
    * The script calculates *Ona Beinonit* as both 29 and 30 days from the start of the previous period.
        * This follows the Halachic concept of *Ona Beinonit*, which is a potential time of menstruation that is observed when a woman does not have a fixed *veset*.

8.  **Sunset Calculation:**
    * The script uses the sunrise-sunset.org API to fetch astronomical sunset for Jerusalem.
        * Astronomical sunset is used as an approximation for *Shekia* (sunset).
        * It's important to note that astronomical sunset is an estimation and is consistently earlier than the actual *Shekia* observed in Jerusalem.
    * If the API is unavailable, the script defaults to 6:00 PM.

9.  **Event Titles:** The script creates events with the following titles: "ה.ט.?", "ל.ט.", "הפ.", "ע.ב.", and "ע.ב., יה"ח".  These titles are intentionally discreet.

10. **Processed Markers:** The script uses "Processed: Own Interval" and "Processed: Previous Interval" in event descriptions to track which events have already been processed.

## Personal Context

I developed this script for my personal use. It was important to me that all interaction with the script occur via Google Calendar. I use a kosher phone (Hadran Waze/email phone) without apps, but I can access my Google Calendar. The calendar is shared only with my husband and is seamlessly integrated into our daily lives. If I need to actively inform him of a specific event, I simply invite him to it. At his request, all event names are discreet to maintain privacy in public settings.
