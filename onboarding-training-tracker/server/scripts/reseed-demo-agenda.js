// One-off script: replace the "New Hire Onboarding: Demo Account & Product Build"
// agenda's modules with the final course content, and regenerate assignments
// for hires currently on that agenda. Run with: node scripts/reseed-demo-agenda.js

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'tracker.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const AGENDA_ID = 3;

const AGENDA_DESCRIPTION =
  'Audience: All CS Employees. Team: Customer Experience. Last Updated: August 2026. Get access to your own demo account, then build every major Builder Prime feature from the ground up exactly as a new customer would.';

const MODULES = [
  {
    category: 'Introduction',
    title: 'Why This Matters',
    description: `One of the most important things you can do in your first weeks at Builder Prime is develop a genuine, hands-on understanding of the product. Our customers are specialty contractors who rely on Builder Prime to run their entire business, from capturing leads to closing jobs to collecting payments. If you can't navigate the product confidently, it's difficult to support, sell, or implement it well.

This document walks you through how to get access to your own demo account and then use it to build every major feature of Builder Prime from the ground up, exactly as a new customer would. By the time you're done, you'll understand the product not just conceptually, but practically.

A general demo account is active for 14 days by default, but with an employee demo account, it will be set to indefinite.`,
  },
  {
    category: 'Part 1: Pre-Start Setup',
    title: 'Demo Account Created Through Maxio',
    description: `Owner: Carly, Mahan, Abby or Margie can create this instance

An admin with access to Maxio will set up the employee test demo account
Reference Demo video for how this will be done: https://www.loom.com/share/d7cd400a00d84ed1ab2a1247f0e460ca
What to enter in the form:

Organization Name, use the employee-test-account format above
Required format: employee-test-account-[employee-first-name]-[employee-last-name]
Note: Using this exact format is important. It tells the system this is an internal test account and prevents the Builder Prime sales team from following up on it as a new prospect.
New Hire name as the primary contact
New Hire work email address
Use the Builder Prime office address for company address fields(9191 Sheridan Blvd, Suite 190, Westminster CO 80031)

Tip: Once submitted, the Product team will receive the request, provision the instance, and the employee will get a sign-in email to the subdomain. This usually takes 1 business day.`,
  },
  {
    category: 'Part 1: Pre-Start Setup',
    title: 'Confirm Access',
    description: `Owner: New Hire

Once the account is provisioned, the employee will receive a sign-in email from Builder Prime. The subdomain will follow this format:

Your subdomain: employee-test-account-[your-name].builderprime.com

Click the link in the email to set your password and log in
Confirm you can access the dashboard
Bookmark your subdomain URL, you'll be using it a lot

Note: If you don't receive the email within 1 business day, check your spam folder first, then ping your manager or the engineering team.`,
  },
  {
    category: 'Step 1: Account Setup',
    title: 'Set your company name, logo, address, and timezone',
    description: `This is the foundation. A customer's first hour in Builder Prime is usually spent here.

Let's add your company logo and contact information. This information will pull forward on contracts, invoices, and emails ([sample fake logo](https://drive.google.com/file/d/1m9eRJ5c2Kd2r1lx8fbaiYA3JjVzNve18/view?usp=sharing)).
To add your logo and contact information, go to Admin > Configure > Company Info.
Click the gray box to upload your logo.
An accent color will automatically be assigned, but you can choose your own if desired.
To add your company information, fill out the form on the right with the business name, address, phone number, and email address.

For a video tutorial, check out our guide [here](https://www.loom.com/share/c45a9c57d32c42a6946ddd4270e3aa56?sid=40aa34c5-0e43-4873-b8a1-c8634d37e77a).`,
  },
  {
    category: 'Step 1: Account Setup',
    title: 'Create at least 2 additional users with different permission roles',
    description: `Example: one admin, one standard sales user

Navigate to Admin > Employees
Click the green button at the top right to add a new employee ([Sample employee list](https://docs.google.com/spreadsheets/d/1HQxcz7OPaUDOfYNYVLt2RahJoFNUc8p5zbbfNJhg91c/edit?usp=sharing))
Fill out their contact information and check the boxes on the right to assign where they should be available to assign to leads and/or projects.

For a video tutorial, check out our guide [here](https://www.loom.com/share/4d52357e402d4c068679ff7051f38d7d?sid=3ec3e93f-a2de-439a-a18e-1cfe7dc8dc15).

Relevant Knowledge Base Articles:
How to manage Roles & Permissions: https://builderprimehelp.zendesk.com/hc/en-us/articles/53037453590035-How-to-Manage-Roles-and-Permissions
Adding Users: [here](https://builderprimehelp.zendesk.com/hc/en-us/articles/53036579503763-Adding-Users-to-Builder-Prime)
Changing an Employee's email address: [here](https://builderprimehelp.zendesk.com/hc/en-us/articles/53036419669651-How-to-Update-Employee-Email-Address)
Add Users/employees template: https://docs.google.com/spreadsheets/d/1C_b1YL8V7rwzkABTvIZ-E1V8RGOudeCgHfdCJVGCevo/edit?usp=sharing`,
  },
  {
    category: 'Step 1: Account Setup',
    title: 'Explore the billing/subscription settings so you know where they live',
    description: `Navigate to Admin>my account.

Tip: Pay attention to what each user role can and can't do. This is one of the most common support questions from new customers.`,
  },
  {
    category: 'Step 2: Lead Management',
    title: 'Create a lead source (e.g. "Website", "Referral", "Home Show")',
    description: `Lead sources tell you where an individual lead or opportunity came from. Adding lead sources to the system will allow you to understand where your businesses is coming from, and which sources are the most effective. Your initial lead sources have been uploaded for you, but you can always add additional sources. Additionally, you have the option of tracking your monthly marketing spend!

Here's how to make changes:
Navigate to Admin > Configure > Client Settings
Find the "Lead Sources" table
Click the green "+ New Lead Source" button to add a lead source to the list
If you want to take it a step further and have Builder Prime calculate customer acquisition costs, you have the option of adding your monthly spend by checking the box to add the monthly spend.

Relevant KB Article: https://builderprimehelp.zendesk.com/hc/en-us/articles/53149394058643-Lead-Source-Management

For a video tutorial, check out our guide: https://www.loom.com/share/feec47d06f634e7fb73d68db80b52228`,
  },
  {
    category: 'Step 2: Lead Management',
    title: 'Set up Lead & Project Statuses',
    description: `Builder Prime uses two types of statuses to track your customers: Lead Statuses for the sales process, and Project Statuses for the job once its sold. Together, they map the full customer journey from first contact to completed project.

Most of this is already configured out of the box, intentionally designed to automate key parts of your sales workflow and keep your reporting accurate. Before we start tailoring things to your business, it's worth understanding how these statuses are meant to flow, it makes every other setup step easier to follow.

Special Note: The order of Lead Statuses matters, certain milestones in the default sequence are tied directly to reporting accuracy. If a customer wants to make changes, we recommend they work with a Project Manager before doing so.

Please watch [this video](https://www.loom.com/share/ed0ba2366f7b42258f0248dc560729b5?sid=6312308c-2ee6-4d54-a450-ffc0c5a682b5)

More information can be found in the Knowledge Base here:
[Lead Status Configuration](https://builderprimehelp.zendesk.com/hc/en-us/articles/53149797957267-Lead-Status-Configuration)
[Project Status Configuration](https://builderprimehelp.zendesk.com/hc/en-us/articles/53147611398035-Project-Status-Configuration)`,
  },
  {
    category: 'Step 2: Lead Management',
    title: 'Adding a Lead',
    description: `Now that we have a solid understanding of the lead flow, it's time to see how it all comes together. We are going to add a lead and schedule a sales appointment. The first step is adding a lead to the system.

Click the green "+ New Client" button at the top right corner of any page in Builder Prime.
Add a name and email address. You will have to use an email address that is different than the one you're logging in with.
You can add additional details below, like lead source, what they're interested in, and any notes.
Once you've filled out the info, click the "Save" button. You'll notice additional widgets pop up that will help you manage the lead.
The widgets are pretty self explanatory, but feel free to test adding notes, sending emails, etc.

For a video tutorial on adding a lead, check out our guide [here](https://www.loom.com/share/00350238aa57461d81876bafd2bbb1b0).
We also have a robust knowledge base section on lead management [here](https://builderprimehelp.zendesk.com/hc/en-us/sections/53147761750291-Clients-and-Leads).`,
  },
  {
    category: 'Step 2: Lead Management',
    title: 'Set up at least one automation',
    description: `For example, auto-assign a lead by zip code, or create a follow-up task when a new lead comes in.

Update Lead/Project Status - there are certain stages where you'll want to automatically update the status if a lead has been idle for a few days. An example of this is if the lead has been sitting in "Lead Received" for 3 days, you may want to go ahead and move them to "Appointment Not Set" automatically so that your Lead Received status includes only the freshest leads.
Go to Admin > Configure > Lead Statuses.

For a video Tutorial: check out this guide [here](https://www.loom.com/embed/bcb0c50940b142e899f080870ff64371)
Relevant Knowledge Base Article: https://builderprimehelp.zendesk.com/hc/en-us/articles/53110512209043-Lead-Project-Status-Automation.`,
  },
  {
    category: 'Step 2: Lead Management',
    title: 'Verify leads appear correctly and route as expected',
    description: `Note: You will be asked to demonstrate that your automations actually fire correctly, not just that they were created. Test everything.`,
  },
  {
    category: 'Step 3: Project Workflows',
    title: 'Create Project Type',
    description: `Similar to Lead Statuses, Project Statuses provide the customer and their team with the ability to effortlessly track the progress of a client's project. Project Statuses will also provide the opportunity to create automations as a project progresses to boost efficiency.

Special Note: the order of Project Statuses is important. A project should progress down the statuses and not upward.

For a video overview, click [here](https://www.loom.com/share/9563056f4c5b480b807a8194780b692c?sid=35b427fa-4f0d-4daf-ba03-00f7eda56551).

We use the "Project Type" field for a few things within the platform. The first being the "Interested In" field on a client record. This will pull forward into the project as well. Most reports can be broken down by project type so you can understand where you're having the most success. We will also use project types to create automated install reminders.

Your initial project types from your intake form have been imported for you. If you ever want to add or change your project type options, here's how:
1. Navigate to Admin > Configure > Project Settings
2. Find the Project Types table
3. Click the green "+ New Project Type" button to add a project type to the list
4. Check the active box to make sure this is available to choose going forward.
5. For a video tutorial, check out our guide [here](https://www.loom.com/share/53211197058b49b0bc152fc501132e12?sid=bf288751-b44f-4c79-a3dc-b6af2cc38fbd).

*Please note, while there is not a limit of how many Project Types you can create, you can only select one per opportunity. Ex: While you cannot select both "Windows" and "Doors", you can create a third option titled "Windows & Doors"

Relevant Knowledge Base Article: https://builderprimehelp.zendesk.com/hc/en-us/articles/53112386043411-Project-Type-Management

Task to complete after this module: put together project types to then manually add (run it by your buddy to be sure)`,
  },
  {
    category: 'Step 4: Initial Integrations',
    title: 'Initial Integrations',
    description: `Builder Prime integrates with our customers favorite tools. These can be found under Admin > Integrations. We do recommend holding off on a couple of the integrations until the software is closer to being ready to go live.

Okay to set up now:
1. Email - it is highly recommended to connect your custom email domain for sending emails. We also have Gmail, Google Workspace, and Outlook email integrations. Admin > Integrations > Email
2. Calendar - this is a two-way sync with both Google and Outlook calendars.
3. Kb articles to help assist with this integration:

Task to be completed after this step: Complete [gmail](https://builderprimehelp.zendesk.com/hc/en-us/articles/52833222389395-Gmail-Google-Workspace-and-Outlook#h_01M11BNHFJC670EM51E2TTZEEQ) integration & [calendars](https://builderprimehelp.zendesk.com/hc/en-us/articles/52834331425043-Setting-Up-Shared-Company-Google-Calendar) integrations.

The following Integrations cannot be completed due to the lack of the app itself, but read related KB article:
1. [QuickBooks Desktop Integration](https://builderprimehelp.zendesk.com/hc/en-us/articles/53108048200851-QuickBooks-Desktop-Integration)
2. [QuickBooks Online Integration](https://builderprimehelp.zendesk.com/hc/en-us/articles/53075395315731-QuickBooks-Online-Integration)
3. Lead Generators Integration - [How to Import Leads from an Email](https://builderprimehelp.zendesk.com/hc/en-us/articles/52835871194131-How-to-Import-Leads-from-an-Email), [Zapier](https://builderprimehelp.zendesk.com/hc/en-us/articles/52836114234387-Zapier-Integration) & [Open API](https://builderprimehelp.zendesk.com/hc/en-us/articles/52835741625491-Open-API-Documentation)
4. For a video tutorial, check out our guide [here](https://www.loom.com/share/e36dd1b65f4b49c58acf59b7534bf1d9?sid=eea6c43f-419d-4cf5-9e55-6c5717ca76e0).`,
  },
  {
    category: 'Step 5: Understand Payments',
    title: 'Understand Payments with Builder Prime!',
    description: `Builder Prime has a built-in payment processor that allows you to streamline billing so you can collect payments electronically via credit card, debit card, mobile checks or ACH and simplify your process, making getting paid - seamless!

Check out the Knowledge Base article for more info [here](https://builderprimehelp.zendesk.com/hc/en-us/articles/52835498117651-Collecting-Online-Payments).`,
  },
  {
    category: 'Step 6: SMS Activation',
    title: 'Understanding SMS Activation',
    description: `For adding the SMS Add-on, The customer will have to submit a registration form. You can find more information about this at Admin > Integrations > SMS. Additional resources are available [here](https://builderprimehelp.zendesk.com/hc/en-us/articles/52835161417363-Requesting-an-SMS-Number).

IMPORTANT: Please read through the attached SMS Registration [Guide](https://shared-space-files-production.s3.amazonaws.com/67aec5558cce5ea41ddca714/6a6366db0cf02b0ad01dae75/6a6366e60cf02b0ad01daecf/One%20Pager%20-%20SMS%20Registration%20Instructions.pdf?AWSAccessKeyId=ASIARQHXSZZVFWVGWC3K&Expires=1788651286&Signature=3gdP3WiK4c9heQgVv7sJZH8gOuY%3D&X-Amzn-Trace-Id=Root%3D1-6a981336-5c66b74571e7ed490ca12dfc%3BParent%3D728cecb2b813886e%3BSampled%3D0%3BLineage%3D1%3A2fe22945%3A0&x-amz-security-token=IQoJb3JpZ2luX2VjEP3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDJFUtWcgH0TuPbmfJhknlQi%2F2pGqeqmYFimdOenjKYLwIgCos%2Bo%2FHr4%2F1g3MUGKWi5scBOL%2F5b4ifzwkorKKPNiiMq%2BAMIxf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARACGgwxMDM1OTg0NDQxMzgiDMTQQyp%2FaXhMHNzXNCrMA0yhzmM2Y2sTOqxwpTk%2FYuKBys9vBqi8aVY3XtBtuoHFYc13h7OhAvic6rCu5ItaRaDX2CogWkJ9ln8MeWLhW9TIYi0TPq9RlFiPq6GBaiF%2BJVF9J3ovAqYj3PzakAd2dPzt5Lf3E2zd0zFVsevUNw2ok0%2FE16%2BU5gUJuypzylnBIulir47lMuUcXihuuDpb9LCBLyRgrvQkR%2BnwTeq0Js0p2mEOGnjFp9f6SLgPsochxWy2aciO9xNm78nE4GeuRrUPmQKYcMVMt4oYIY%2BNuzeLei23nnKNcwsaqI6otmomwmJ1BdrGcDvg0ynF1Cn9f80My%2Fdcwb5ssPHYYlshvdIljwI3AZT9V1Nt%2FPxY3dzitF3%2Bhkp96cnYAs%2B4ULUoeraqjJ2pmQeKYmGMeTgWl0JTZgMduyleNCqFS47CVNF88xEfO0lVpssQCbUiCK2mo4XQF7SAFQuh6V8DVslBKgW0RO6rcJyHvN4P7gIPL9BxKW8Sj5svCHrJx92697Jpi50%2FUtol4ifz1Vk7KP2cAMUWK7SWomAvWUCojxGcUDZ6EETbDktyXv%2FEkddOxenz8uX1iyv7ANgGxAYnf1JbVM72Nm1Q6wMpSOzyUDQwo6Xg1AY6oQEvmMkwyiZHECelPvdoYqlDzrJlbCtlRfZBUBOoD5A6k%2F5qM6Yf%2Fe2IgecK3USwBOdurNmAYNKdbM5qg5tNV%2FDn5hkxTVokRfISWaLO7QYK74wGDgnt9Zpx91a4F46t%2Fz9EXV7ORg0GEUGCIMFqjZhmSoW3J6mfMBhPiYbxfmBWTG4Hf0UcM68%2Fij9E9vMjISIwM%2Br14xteuXIO0dFO3%2Fmk%2Bw%3D%3D). There are mandatory requirements outlined in this document to ensure a smooth application process. If this is skipped, registration can take up to 2 weeks or more to complete.`,
  },
  {
    category: 'Step 7: Weekly Check-in with Buddy',
    title: 'Weekly Check-in with Buddy',
    description: `Before the call connect with your assigned buddy, login to your demo account and check if you have completed the basic setup correctly (until step 4) so you can help fix any mistakes while on the call with the buddy. Also be sure you have read through the Step5 & 6 as this may be covered in your certification. 🙂`,
  },
  {
    category: 'Step 8: Email & Text Templates',
    title: 'Create Email & Text Templates',
    description: `Creating custom email and text templates is easy in Builder Prime. We will focus on an email template since it's unlikely SMS is set up yet, but the same rules apply for email as they do text.

1. Navigate to Admin > Configure > Email & SMS
2. In the email template widget, click the green button to create a new custom email template
3. Name the email template something obvious so you know what the template will be used for, and add a description.
4. Choose whether this email is intended for clients or employees.
5. Choose the context. Client is if the email is going to be attached to a Lead Status, Meeting is if the email is going to be attached to a Meeting Type, Project is if the email is going to be attached to a project status or a project type. (Note: the context determines what type of variables we can use in the template. The variables change based on the context. So if you are pulling details from the client record, context = client, pulling details from the meeting context = meeting.)
6. Add a subject line and fill out the body of the email.
7. To use variables, which will pull in things like client name, sales rep name, etc., type the % sign. This will populate a list of variables that can pull in data automatically when using the template.
8. Once the email template is complete, press Save & Close.

For a video tutorial, check out our guide [here](https://www.loom.com/share/aa08382857e6418c93dc3e23df5ba132?sid=bfe1e95a-850f-4abf-bd99-8692251f2bb3).`,
  },
  {
    category: 'Step 9: Automations & Customer Communications',
    title: 'Build Different Types of Automations',
    description: `Within Builder Prime, you are able to create different types of automations. Below we will review each kind and how they are often used in Builder Prime.

Email - create custom email templates and send these to your clients or your team; often used to send more information about the company or as part of a campaign to request reviews after a project has been completed.
SMS - send text messages to your clients; often used in speed-to-lead campaigns or for appointment reminders. Some companies also like getting text alerts when a lead or project reaches a certain milestone. Note: Accounts can only create SMS automations once they have been approved for SMS and have a phone number registered.
Add to Call Queue - there is a call queue on the dashboard page, and companies will create automations to add leads to the call queue when they land in the system
Create To-do - this is commonly used to create to-do tasks for internal team members; often, this is a great automation to help streamline internal handoffs. Once a job is sold and ready to be passed for production, an automated to-do task can be created for the project manager to review the details and order materials.
Send Webhook - Builder Prime supports webhooks to send data from our system and into another. Webhooks can be created using a paid Zapier account.
Update Lead/Project Status - there are certain stages where you'll want to automatically update the status if a lead has been idle for a few days. An example of this is if the lead has been sitting in "Lead Received" for 3 days, you may want to go ahead and move them to "Appointment Not Set" automatically so that your Lead Received status includes only the freshest leads.

For a video tutorial, check out our guide [here](https://www.loom.com/share/25bd1a342afa44cfa00b989aeeba6767?sid=310a5d03-ce0e-46f2-b072-41b016d0b00a).`,
  },
  {
    category: 'Step 9: Automations & Customer Communications',
    title: 'Create an email automation',
    description: `Now that we know the automation types and have created our first email template, we are ready to build our first automation. We will automate an appointment confirmation email that will send when an appointment scheduled.

1. Navigate to Admin > Configure > Lead Statuses and click into the Appointment Set status.
2. Click the green button at the bottom of the status window to create a new automation.
3. Select "Email" from the action type dropdown in the top right corner.
4. There are additional settings you can select, such as whether or not the automation sends on weekends. Once you have the settings correct, press the save button.
5. Additionally, we can suppress automations by lead source, project type, and class. For example if we suppress by the lead source: Home Show, it will only trigger that automation for home show leads (everything else will be skipped/suppressed)
6. On the next window, you'll click the green button to create the email action.
7. Add any time delays, choose the recipient (Client), and choose who the email is coming from. Finally, select the email template from the dropdown.
8. Save & Close three times, and the automation will be live.

For a video tutorial, check out our guide [here](https://www.loom.com/share/c850a785261a4737b57446a81a64d3ee?sid=2cbc201e-c5e3-4112-8736-1a4132aa86e1).`,
  },
  {
    category: 'Step 9: Automations & Customer Communications',
    title: 'Set up an appointment reminder automation for both SMS and email',
    description: `Customer Communications

Automated and manual outreach, this is how Builder Prime keeps customers informed throughout the job lifecycle.`,
  },
  {
    category: 'Step 9: Automations & Customer Communications',
    title: "Customize the post-install review request message (don't leave it as the default text)",
    description: '',
  },
  {
    category: 'Step 9: Automations & Customer Communications',
    title: 'Test the unsubscribe/opt-out flow and confirm it works correctly',
    description: '',
  },
  {
    category: 'Step 9: Automations & Customer Communications',
    title: 'Create another test automation',
    description: `Using what you've learned, create another email automation on a different lead status.

Your buddy will review the automation you set up on your next call, so be sure you have valid reasoning for the automation you created.`,
  },
  {
    category: 'Step 10: Price Book',
    title: 'Price Book',
    description: `Every proposal and estimate is built from the price book. If a customer's price book is a mess, their proposals will be too.

Create at least 2 product categories (e.g. "Windows", "Labor").
Add 5 or more line items with correct pricing, units, and descriptions
Configure a discount or promotion rule and test that it applies correctly
Build at least one package or bundle from existing line items

Refer to this guide here, enlisted with video tutorials: [Price Book Import Instructions](https://app.notion.com/p/builderprime/Price-Book-Import-Instructions-36ee7ca8202780ae9bd4e522cadda79e)

Tip: Use realistic pricing for a specialty contractor vertical, window replacement, concrete coating, or flooring all work well. Realistic data makes the rest of the build more useful.`,
  },
  {
    category: 'Step 11: Schedule Meetings & Sales Calendar',
    title: 'Schedule Meetings & Check Sales Calenders',
    description: `One of the goals you'll have with your clients is scheduling an appointment on the sales calendar. There are two ways to schedule a sales appointment. The first way you'll learn is from the client record.

1. Open a client record by searching for the client using the global search bar at the top of your Builder Prime screen or by clicking Clients > Show All in the left menu to see all of the clients in the system.
2. Once the record is open, you'll look for the "Meetings & Reminders" widget on the right side of the page, it's usually the 3rd widget, and click the green button to schedule a new meeting.
3. This is where you can choose a sales rep to assign to the meeting and view their availability. You can either drag and drop the meeting on the calendar, or you can use the date and time selectors.
4. Once you have a time selected, click the save and close button.
5. If you did not have a sales person attached to the client form yet, you will receive a pop up asking you if you'd like to change the sales person to the employee that will be attending the meeting. Select yes or no.
6. Now that the meeting is scheduled, you should notice that the lead status has been updated automatically to "Appointment Set".
7. For a video tutorial, check out our guide [here](https://www.loom.com/share/6759793f865a457f8c1df605f8b31b43).

The calendar when scheduling from a client meeting will show availability for one rep at a time. There is a full sales calendar where you'll be able to see all rep availability.

1. Navigate to "Schedule" on the left menu and click "Sales Calendar".
2. There is a panel on the left where you can see the different employees, and you are able to click to filter the availability based on rep.
3. At the top right corner of the calendar, you'll see a row of buttons with different options to change what the sales calendar looks like. All of the appointment data will be the same, but these are options that change the organization of how they are shown. Everyone is different, so it's recommended to explore and find the view that works for you.
4. To schedule a meeting from this view, click the "New Meeting" button at the top left of the calendar screen. You can fill out the meeting form and assign the sales rep. Save & Close to schedule the meeting.
5. If you'd like to change which employees are visible by default in your sales calendar, you can adjust this within each employee's record. Go to Admin > Employees, click into an employee, and check or uncheck the box that says to show in the sales calendar by default.

For a video tutorial, check out our guide [here](https://www.loom.com/share/79d213031e31407bac263af2a509d8dd?sid=2b123127-ebaa-4fed-834d-7152e62120cd).`,
  },
  {
    category: 'Step 13: Estimating & Proposals',
    title: 'Create a Project for estimating',
    description: `Upload Pricing Structure and Estimate Examples
The proposal is what a salesperson puts in front of a homeowner. It needs to look professional and be built correctly from the price book.

Builder Prime allows you to manage each of your projects from estimating through completion in Project records. To create a new Project record and begin the estimating process, navigate to the Client record and follow the steps below:

1. Open a client record by using the global search bar at the top of the Builder Prime screen or by clicking Clients > Show All from the left menu.
2. Once inside the Client record, locate the "Work History" widget on the right side of the page and click the green "+ New Project" button.
3. Give the new Project a name (not required, but recommended).
4. Depending on the information already indicated in the Client record, the following fields may automatically be filled:
   Project Type (based on the project type indicated in "Interested In")
   Work Site Address (defaults to the primary address)
   Sales Person (if already assigned)
5. Click the blue "Save" button. You'll notice new tabs populate across the top of the project after saving, and this is where you will be working from for the upcoming tasks.

For a video tutorial, check out our guide [here](https://www.loom.com/share/82faa5afc11449dd93392506149ad005?sid=90584f85-ffaa-413d-b2ae-a4d4bb6f879e).`,
  },
  {
    category: 'Step 13: Estimating & Proposals',
    title: 'Build a scope',
    description: `Building a scope is how we put together the different items to create a price for the estimate. If you're working ahead and we haven't yet built out your Price Book, you can use the template you imported for this step.

Open a created project and follow the steps below to build out your scope of work.

1. From within the project, click the "Scope" tab along the top.
2. Click the button to add an item from your Price Book.
3. Go through your categories and items to find what you need, fill out any additional details, and save this to the scope.
4. Multiple items can be added by clicking the button to add additional items.
5. At this stage, you can add discounts or upcharges.
6. To review the current price, click the "Pricing" tab at the top of the project.

Example use cases of when a client would opt to use task based [templates](https://drive.google.com/file/d/1gkdY-hwdrSgxXm7MbVUv7blSCXLugNTn/view?usp=sharing).

For a video tutorial, check out our guide [here](https://www.loom.com/share/369374d56fbc44bab26cf3dfcb215c9b).`,
  },
  {
    category: 'Step 14: Contracts',
    title: 'Create a contract template',
    description: `To create your contract template, follow the steps below.

1. From the left menu, navigate to "Admin" > "Configure" > "Contracts".
2. Find the section titled "Contract Templates" and click the green button to create a new template.
3. Choose one of the Price Book design templates based on who you'd like to set up as the first signer.
4. A template name is required, but once the name is added you can either continue to set up additional settings, or you can save the template.

Optional: If you have one set of terms and conditions, these can be added on the main contract page. If you have unique terms and conditions depending on different contract types, you can load these into the template itself.

For a video tutorial, check out our guide [here](https://www.loom.com/share/ee6d75c8fb9d47ea83c12f3366c7c1dd?sid=d883513a-7028-4df5-bdc0-8cfeae21d925).

[Sample Terms & conditions that you can use](https://docs.google.com/document/d/1v31dHpe4EoGk6ytl112kIxZqkEODhirxpPg6YLIZe9g/edit?usp=sharing)`,
  },
  {
    category: 'Step 14: Contracts',
    title: 'Generate a Contract',
    description: `Once the scope is complete, and we have our final price, we can move to the next step of generating a contract. For clarity, the term "contract" can be changed to agreement, estimate, etc.

1. Within the project, click the "Contract" tab along the top.
2. Click the green button to generate a contract. This will pull up the default contract template.
3. You can change the contract template, or you can stick with the default.
4. This preview screen will allow you to change any settings before the document is generated.
5. When you're ready, go ahead and click the button at the bottom to generate the contract.
6. After the contract is generated, you can preview the PDF and send it to collect eSignatures.

For a video tutorial, check out our guide [here](https://www.loom.com/share/40e6a7d7e5384da4a1ee710a68b60a77?sid=eda8d5dc-a7f8-44a2-a28b-8f53586b354d).`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Assigning Labor',
    description: `To assign labor to your project, you'll first want to open the project you're working on. From here, you'll follow the steps below.

1. Click the "Scope" tab at the top of the project window.
2. Once in the scope, you'll see a section that says Item and Grid View at the top of the table. Switch to the Grid View.
3. If we did not already include labor within your estimating tool, you may need to create a subtask. To do this, click into the main line item and click the green button that says "+ New Subtask".
4. Label the subtask "Labor" and then click the "Assignments" tab within the subtask.
5. Choose your employee or subcontractor from the dropdown and input hours and pay (for subcontractors only).
6. Make sure to click the green assign button before saving the subtask.
7. For a video tutorial, check out our guide [here](https://www.loom.com/share/44a20a94730c48fab6d61e17c90455d8?sid=9fc41027-22b0-4671-a72f-ac243752d8a9).`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Templating Labour into the pricebook build',
    description: `Labor can be assigned when building a template or added later after the project is sold. Employee Profiles can be used as placeholders in templates and swapped for the actual employee or subcontractor once the work is ready to be scheduled.

Method 1: Assign labor placeholders in a template
If your work is repeatable or formula-based, you can add generic labor roles to a template using Employee Profiles. For example, you might create placeholders for a crew lead, painter, or installation technician.
This is especially useful when labor costs can be calculated based on a consistent formula. For example, if a subcontractor is paid per square foot, the labor cost can be calculated automatically once the job is sold.
When you're ready to assign the actual worker:
1. Open the scope in Grid view.
2. Click Workers or Subcontractors at the top of the Grid.
3. Find the Employee Profile you want to replace.
4. Click Swap Out.
5. Select the actual Employee or Subcontractor who will be completing the work.

Note: Once a subcontractor's work has been added to a subcontractor purchase order, the assignment cannot be swapped until the purchase order is removed.

Method 2: Add labor after the project is sold
You can also assign labor at any point during the project's lifecycle, including after the project has been sold.
1. Open the project in Grid view.
2. Add a subtask under the appropriate task group.
3. Open the subtask and go to the Assignments tab.
4. Add an Employee, Subcontractor, or Employee Profile.
5. Enter the estimated effort hours and cost.

This allows you to assign the appropriate person to each task as project requirements become clearer.

Note: Assigning labor requires permission to view project financials.

Related Articles & video tutorial to read: https://builderprimehelp.zendesk.com/hc/en-us/articles/53111420310547-Labor-and-Material-Assignments#h_01M11HT9RNP1JP55PYYRCN340D`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Assigning Materials',
    description: `To assign materials to your project, you'll first want to open the project you're working on. From here, you'll follow the steps below.

1. Click the "Scope" tab at the top of the project window.
2. Once in the scope, you'll see a section that says Item and Grid View at the top of the table. Switch to the Grid View.
3. If we did not already include materials within your estimating tool, you may need to create a subtask. To do this, click into the main line item and click the green button that says "+ New Subtask".
4. Label the subtask "Materials" and then click the "Materials" tab within the subtask. You can also add materials to an existing subtask if you'd like.
5. If you don't have any materials in the system yet, you'll click the blue link to create the material. Fill out the material form, including your purchase cost, then save and close.
6. Input the quantity of the material that is being assigned to the project.
7. Make sure to click the green assign button before saving the subtask.
8. You can add more than one material by repeating to create the material, add the quantity, and clicking the green assign button.
9. For a video tutorial, check out our guide [here](https://www.loom.com/share/094174142b0c4ad29312afa051873267?sid=86de4d61-8174-4447-8ff4-518893e58215).`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Templating Materials into pricebook build',
    description: `Materials can be added to a project in advance through a template or added as needed during the project. Before assigning materials, it's helpful to have them available in the Inventory section of your Builder Prime account. If an unexpected material need comes up, you can also create and add a new material directly from the project.

Method 1: Preassign materials in a template
Materials can be added to both Task-Based templates and Price Book items.
In a Task-Based template, add materials from the Materials tab of a subtask.
In the Price Book, add materials from the Materials tab of a Cost / Expense within an Item or Addon.

For each material, select a Calculation Type (Quantity):
Per item — Assigns a fixed quantity of material to the entire line item.
Per measurement unit — Calculates the quantity based on the project's measurement.

For example, if one gallon of paint covers 250 square feet, you can calculate the amount needed per square foot:
1 ÷ 250 = 0.004 gallons per square foot
When you build the estimate, Builder Prime automatically calculates the material quantity and cost based on the template.
If the material requirements differ from the template, open the Grid view and adjust the material assignment within the appropriate subtask.

Method 2: Add materials as needed
If you don't know in advance which materials will be required, you can add them at any point before, during, or after the project.
1. Open the project in Grid view.
2. Add a subtask under the appropriate task group.
3. Open the subtask and go to the Materials tab.
4. Add the required material and quantity.`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Review and Manage Materials',
    description: `Regardless of how materials were added, you can review all material assignments for a scope from the Materials button at the top of the Grid view.

The overview shows:
Material
Task
Quantity
Unit of measure
Cost
Status
Lot information
Purchase order references

Material statuses include In Stock, Pending Order, Pending Receive, Used, and Partially Used.

From this view, you can also:
Allocate materials from inventory.
Unallocate materials.
Add materials to a purchase order.

These actions require the appropriate inventory and purchase-order permissions, as well as a sold contract on the project.

If you have export access, click Excel to download the full material list.

Related articles and video to read: https://builderprimehelp.zendesk.com/hc/en-us/articles/53111420310547-Labor-and-Material-Assignments#h_01M11HV215952PPZMZ95KGS7NY`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Managing Subcontractor Work Orders',
    description: `A subcontractor purchase order (PO) captures the scope of work and agreed cost you're giving a subcontractor on a project, and tracks eSignature, payments, and the balance you owe them.

Read this article for step-by-step on how to manage: https://builderprimehelp.zendesk.com/hc/en-us/articles/53147491199251-Create-and-Manage-Subcontractor-Purchase-Orders#h_01M11GV4NMQAQTZGQVME3AN0M8

Link video once created from fluency framework: 'Managing subcontractor purchase orders' under complete the job tab`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Managing material purchase orders',
    description: `Material Purchase Orders are used to record and track orders placed with suppliers in Builder Prime (they aren't automatically transmitted to the supplier). Steps:

Set up a Vendor in Inventory
Build a purchase order from material lots
Track statuses (Created, Submitted, Ordered, Received)
When lots are received (inventory receipt date), stock becomes available.

Read this article and linked videos to learn more: https://builderprimehelp.zendesk.com/hc/en-us/articles/53111221361171-Managing-Inventory

Link video once created from fluency framework: 'Material purchase orders' under complete the job tab`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Invoicing and Payments',
    description: `Builder Prime has a built-in invoicing feature that will pull directly from the contracted amount to help keep your books in order.

1. To create your first invoice, navigate to the "Billing" tab at the top of a project.
2. Click the green button to create a new invoice.
3. You have the option of creating a partial invoice for a deposit, or you can create one big invoice and record multiple payments against it as the project progresses.
4. Special Note: If you check the "Deposit" box, this will push the invoice to QuickBooks as a liability instead of an asset.
5. Once you're happy with the invoice amount, press the Save & Close button.
6. You can now email the invoice to the client, send it for payment if you already have payments set up, or you can manually record a payment.

For a video tutorial, check out our guide [here](https://www.loom.com/share/d1f6a2b7a4904c3aa3629b1dcae6ac95?sid=e7a8d2f9-697e-4f53-9cc8-ffeea4cff9b8). Use this tutorial to create a dummy invoice.`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Collecting Online Payments',
    description: `Builder Prime makes it easy to send invoices and collect payments directly in the platform through our built-in payments integration with Payabli. With Payabli, customers can send invoices for payment in just a click and automatically record and manage payments as they're received.

1. Navigate to Admin > Integrations > Payments
2. Choose how you'd like processing fees handled:
   Pass-through pricing – the fee is passed on to the customer
   Absorbed pricing – you cover the processing fee
   Be sure to review local and state regulations to ensure compliance.
3. Select which option you want and a secure application form will open. You'll need to submit your business details, ownership and contact details, processing information, services and pricing, and finally banking documents.
4. Once submitted the underwriting process will begin, this can be completed in as little as one day. We'll send you an email once the integration is ready to use.

Note: This cannot be setup on your demo account, but make note of it as you will need to know how this works.

For a video tutorial, check out our guide [here](https://www.loom.com/share/e22f281e4c7c41a189a33da329064f66).`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Scheduling the Project',
    description: `Once you are ready to add the project to the schedule, you'll click the blue button towards the top of the item or grid view that says "Add to Schedule". Choose a start date for the project, and this will add the project to the production calendar.

Adding the project to the calendar will populate a gantt chart for easy management of each phase.

For a video tutorial, check out our guide [here](https://www.loom.com/share/23d45995f5d34e63b553f4238bce3c6b?sid=557ed8ae-4446-4a62-9079-3d731973f1a2). (Once the Fluency framework piece from Complete the job within the 'Scheduling the work order' is ready - link that video here.)

NOTE: If you click into the gantt chart, double click on the subtask you can manually change date/time if needed`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Production Calendar Review',
    description: `The full production calendar is going to be a valuable tool as the customer schedules out projects. To access the production calendar, navigate to "Schedule" from the left menu and click into "Production Calendar".

From the production calendar you can add "placeholders". While placeholders are not connected to a specific job or client, it allows you to have almost like a sticky note on the calendar. Customers will use this to represent subcontractor unavailability (ooo) or holding labor for large potential clients.

If you do not see the filter menu, click the vertical blue bar along the edge of the calendar.

There are two views. The project view will show all of the projects and can be color coded by project, project type, project manager, foreman, or sales person.

The Assignment view allows you to see where you've assigned your internal employees as well as your subcontractors so it's easy to see who is available when trying to add labor assignments to a project. You can also choose to view unassigned tasks, so you can see where labor is still needed.

For a video tutorial, check out our guide [here](https://www.loom.com/share/50dfb155445f4397b4290e188e747994?sid=6b6f02a9-7235-4bb2-b988-4a4693d6a4f1).`,
  },
  {
    category: 'Step 15: Project Management',
    title: 'Project File Management',
    description: `Each project in Builder Prime has a dedicated file repository for photos, documents, and notes. To access these pages, follow the steps below.

Photos
Open the project and navigate to the "Photos" tab along the top. Here you can upload photos, create photo folders for before/after, and add captions to photos that have been loaded in. These photos are also available to email to clients or to include as an attachment to your contract.

Documents
Open the project and navigate to the "Documents" tab along the top. Here you can upload documents as well as create folders for better organization. These documents can also be attached to contracts.

Notes/Log
Open the project and navigate to the "Log" tab along the top. Here you and the team can have a central place to keep any project notes organized and easily accessible. Photos can also be attached to notes for visuals if something specific is being logged.

For a video tutorial, check out our guide [here](https://www.loom.com/share/74912b5c6c78435388166d6c1699d6ba?sid=0903d9b1-e88a-451c-aaca-2a0d0e1c7258).`,
  },
  {
    category: 'Step 16: Weekly Check-in with Buddy',
    title: 'Weekly Check-in with Buddy',
    description: `Before the call connect with your assigned buddy, login to your demo account and check if you have completed the basic setup correctly (until step 4) so you can help fix any mistakes while on the call with the buddy. Also be sure you have read through the Step5 & 6 as this may be covered in your certification. 🙂`,
  },
  {
    category: 'Step 17: Reporting & Bolt Insights',
    title: 'Standard Reporting',
    description: `Reporting is how a customer understands the health of their business. You should be able to pull any report a manager might ask for.

Run a report that will show you customer close rates as well as a run down of all the opportunities that were created this month
Run a report that shows you all the contracts sold this month
Run a report that shows you any open project on your pipeline`,
  },
  {
    category: 'Step 17: Reporting & Bolt Insights',
    title: 'Bolt Insights (if turned on for demo accounts)',
    description: `Build a close rate report filtered by lead source
Run a revenue report for a specific date range
Create a custom dashboard with at least 3 relevant widgets
Export a report to CSV and spot-check the data against what you see on screen`,
  },
  {
    category: 'Certification',
    title: 'Completing the Certification',
    description: `Once you've worked through all modules, you'll do a live walkthrough with your manager or a senior team member. They'll ask you to demonstrate specific parts of what you built and explain your decisions.

This is not a gotcha exercise. Gaps are expected, especially early on. The goal is to surface where you need more support so we can get you there faster.

What happens after the walkthrough:
Modules you pass, you're certified and move on
Modules that need improvement, you'll get specific feedback and a targeted re-do
Modules you fail, you'll rebuild that section from scratch on a clean instance before re-testing

Tip: The team members who do best in this exercise are the ones who treat it like a real customer build, not a checklist. The more seriously you take the setup, the more you'll get out of it.`,
  },
];

const run = db.transaction(() => {
  db.prepare('UPDATE agendas SET description = ? WHERE id = ?').run(AGENDA_DESCRIPTION, AGENDA_ID);

  // Deleting modules cascades to delete their assignments.
  db.prepare('DELETE FROM modules WHERE agenda_id = ?').run(AGENDA_ID);

  const insertModule = db.prepare(
    'INSERT INTO modules (agenda_id, title, description, category, order_index) VALUES (?, ?, ?, ?, ?)'
  );
  MODULES.forEach((m, index) => {
    insertModule.run(AGENDA_ID, m.title, m.description, m.category, index);
  });

  const newModuleIds = db
    .prepare('SELECT id FROM modules WHERE agenda_id = ? ORDER BY order_index')
    .all(AGENDA_ID);

  const hires = db
    .prepare('SELECT DISTINCT new_hire_id FROM hire_modules WHERE agenda_id = ?')
    .all(AGENDA_ID);

  const insertAssignment = db.prepare(
    "INSERT INTO assignments (new_hire_id, module_id, status) VALUES (?, ?, 'not_started')"
  );
  for (const hire of hires) {
    for (const mod of newModuleIds) {
      insertAssignment.run(hire.new_hire_id, mod.id);
    }
  }

  // Reset per-hire module stage/progress for this agenda; the app recomputes
  // it from the fresh assignments on next server start / PATCH.
  db.prepare(
    "UPDATE hire_modules SET stage = 'not_started' WHERE agenda_id = ?"
  ).run(AGENDA_ID);

  return { moduleCount: MODULES.length, hireCount: hires.length };
});

const result = run();
console.log(`Replaced ${result.moduleCount} modules for agenda ${AGENDA_ID}.`);
console.log(`Regenerated assignments for ${result.hireCount} hire(s).`);
db.close();
