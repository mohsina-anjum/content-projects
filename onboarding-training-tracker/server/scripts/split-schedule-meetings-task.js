// One-off script: split the combined "Schedule Meetings, Setup Booking Links &
// Check Sales Calenders" task (module id 146) into three separately
// completable tasks within the same "Step 11" category, and backfill
// assignment rows for every hire already on this agenda so the new tasks
// show up on their checklists/manager drawer.
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'tracker.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const AGENDA_ID = 3;
const CATEGORY = 'Step 11: Schedule Meetings & Sales Calendar';
const EXISTING_MODULE_ID = 146;

const SETUP_MEETINGS_DESCRIPTION = `One of the goals you'll have with your clients is scheduling an appointment on the sales calendar. There are two ways to schedule a sales appointment. The first way you'll learn is from the client record.

1. Open a client record by searching for the client using the global search bar at the top of your Builder Prime screen or by clicking Clients > Show All in the left menu to see all of the clients in the system.
2. Once the record is open, you'll look for the "Meetings & Reminders" widget on the right side of the page, it's usually the 3rd widget, and click the green button to schedule a new meeting.
3. This is where you can choose a sales rep to assign to the meeting and view their availability. You can either drag and drop the meeting on the calendar, or you can use the date and time selectors.
4. Once you have a time selected, click the save and close button.
5. If you did not have a sales person attached to the client form yet, you will receive a pop up asking you if you'd like to change the sales person to the employee that will be attending the meeting. Select yes or no.
6. Now that the meeting is scheduled, you should notice that the lead status has been updated automatically to "Appointment Set".
7. For a video tutorial, check out our guide [here](https://www.loom.com/share/6759793f865a457f8c1df605f8b31b43).`;

const SETUP_BOOKING_LINKS_DESCRIPTION = `- Go to Admin > Configure > Booking Link and configure the booking page for the company or specific location/branch.
- Share the booking link directly with prospects, or add it to your website using the embed snippet. Visitors can add their appointment to Google, Outlook, Yahoo, or Apple Calendar after booking.
- If applicable, use the dropdown next to Add a link to create a booking link for a specific class.
- Use the dropdown under the Lead Status widget to set up the Abandoned Booking behaviour. We recommend using a dedicated status for visitors who start but don't complete a booking, so you can set up specific follow-ups for them.
- If you regenerate the booking link, a new URL is created and the existing link stops working immediately. Make sure to update the link everywhere it has been shared, including your website, embed code, emails, ads, bookmarks, and printed materials.
- Important: The old link cannot be restored once regenerated, so only regenerate it if you want to permanently retire the current link.
- For a video tutorial, check out our guide [here](https://www.loom.com/share/b4c5d5e401bc420e8723b347d18e3822).`;

const CHECK_CALENDERS_DESCRIPTION = `The calendar when scheduling from a client meeting will show availability for one rep at a time. There is a full sales calendar where you'll be able to see all rep availability.

1. Navigate to "Schedule" on the left menu and click "Sales Calendar".
2. There is a panel on the left where you can see the different employees, and you are able to click to filter the availability based on rep.
3. At the top right corner of the calendar, you'll see a row of buttons with different options to change what the sales calendar looks like. All of the appointment data will be the same, but these are options that change the organization of how they are shown. Everyone is different, so it's recommended to explore and find the view that works for you.
4. To schedule a meeting from this view, click the "New Meeting" button at the top left of the calendar screen. You can fill out the meeting form and assign the sales rep. Save & Close to schedule the meeting.
5. If you'd like to change which employees are visible by default in your sales calendar, you can adjust this within each employee's record. Go to Admin > Employees, click into an employee, and check or uncheck the box that says to show in the sales calendar by default.

For a video tutorial, check out our guide [here](https://www.loom.com/share/79d213031e31407bac263af2a509d8dd?sid=2b123127-ebaa-4fed-834d-7152e62120cd).`;

const existing = db.prepare('SELECT * FROM modules WHERE id = ?').get(EXISTING_MODULE_ID);
if (!existing) {
  throw new Error(`Module ${EXISTING_MODULE_ID} not found`);
}

const hireIds = db
  .prepare('SELECT DISTINCT new_hire_id FROM assignments WHERE module_id = ?')
  .all(EXISTING_MODULE_ID)
  .map((r) => r.new_hire_id);

const run = db.transaction(() => {
  // Make room for two new tasks right after the existing one.
  db.prepare(
    'UPDATE modules SET order_index = order_index + 2 WHERE agenda_id = ? AND order_index > ?'
  ).run(AGENDA_ID, existing.order_index);

  // Repurpose the existing row as "Setup Meetings" — keeps its id, category,
  // order_index and existing (not_started) assignments intact.
  db.prepare('UPDATE modules SET title = ?, description = ? WHERE id = ?').run(
    'Setup Meetings',
    SETUP_MEETINGS_DESCRIPTION,
    EXISTING_MODULE_ID
  );

  const insertModule = db.prepare(
    'INSERT INTO modules (agenda_id, title, description, category, order_index, duration_days) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertAssignment = db.prepare(
    "INSERT INTO assignments (new_hire_id, module_id, status) VALUES (?, ?, 'not_started')"
  );

  const bookingLinksId = insertModule.run(
    AGENDA_ID,
    'Setup Booking Links',
    SETUP_BOOKING_LINKS_DESCRIPTION,
    CATEGORY,
    existing.order_index + 1,
    0.25
  ).lastInsertRowid;

  const checkCalendersId = insertModule.run(
    AGENDA_ID,
    'Check Calenders',
    CHECK_CALENDERS_DESCRIPTION,
    CATEGORY,
    existing.order_index + 2,
    0.25
  ).lastInsertRowid;

  for (const hireId of hireIds) {
    insertAssignment.run(hireId, bookingLinksId);
    insertAssignment.run(hireId, checkCalendersId);
  }

  return { bookingLinksId, checkCalendersId };
});

const { bookingLinksId, checkCalendersId } = run();
console.log('Setup Meetings module id:', EXISTING_MODULE_ID);
console.log('Setup Booking Links module id:', bookingLinksId);
console.log('Check Calenders module id:', checkCalendersId);
console.log('Backfilled assignments for hire ids:', hireIds);
