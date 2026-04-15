/**
 * seed-conversation.ts
 *
 * Seeds 10 alternating customer/agent replies on the 3rd most-recent ticket
 * to simulate a long conversation.
 *
 * Usage:
 *   npm run seed:conversation
 */

import 'dotenv/config';
import prisma from './lib/prisma';
import { MessageSender } from './generated/prisma/client';

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

const MESSAGES: Array<{ sender: MessageSender; body: string }> = [
  {
    sender: MessageSender.customer,
    body: `Hi, I wanted to follow up on my original request because I still haven't seen any progress.
I submitted the issue four days ago and received an automated confirmation, but nothing since then.
The problem is affecting my entire team — we cannot export any reports from the dashboard at all.
Every time we click the Export button, the spinner appears for about two seconds and then disappears with no file downloaded and no error message shown.
I have tested this in Chrome, Firefox, and Edge and the behaviour is identical across all three browsers.
I also tried clearing the cache and disabling all browser extensions, but nothing changed.
Our subscription is the Business tier, so I expected a faster response time per your SLA.
Could you please let me know if this is a known issue and whether there is a workaround we can use in the meantime?
We have a board presentation on Friday and the exported reports are a critical part of our preparation.
Thank you for your attention to this matter.`,
  },
  {
    sender: MessageSender.agent,
    body: `Thank you for reaching out and I apologise sincerely for the delay in getting back to you.
I can see your original ticket was flagged correctly but unfortunately got stuck in our triage queue over the weekend.
I have now escalated it to our platform engineering team as a high-priority issue.
Regarding the export bug you described — this matches a regression we introduced in the v3.14 deployment last Thursday.
The root cause is a conflict between our new PDF renderer and certain report templates that include pivot tables.
As a temporary workaround, you can navigate to Reports > Settings and switch the export format from "Auto" to "Legacy PDF".
This will use the older renderer which does not have the conflict, and your exports should complete successfully.
I have verified this workaround on a test account and it resolves the download failure immediately.
Our engineering team is targeting a permanent fix in v3.14.2, which is scheduled for release tomorrow evening.
Please let me know if the workaround works for you and I will keep you updated on the patch release.`,
  },
  {
    sender: MessageSender.customer,
    body: `Thank you for the quick response and for the workaround — I really appreciate it.
I tried switching to "Legacy PDF" as you suggested and the export did complete this time, which is a relief.
However, I noticed that the legacy format does not include the conditional formatting we apply to our revenue columns.
The cells that should be highlighted in red or green appear as plain black text in the downloaded file.
This is a significant issue because our board members rely on that colour coding to quickly identify underperforming regions.
Is there any way to preserve the formatting while using the legacy renderer, or is that a limitation of the older engine?
Also, I wanted to check whether the v3.14.2 fix will restore full formatting support in the new renderer.
If the patch is coming tomorrow I can work around it for one day, but I need confirmation that the colours will be back.
One more thing — two of my colleagues are getting a completely different error: a "403 Forbidden" message when they try to export.
Their accounts have the same role and permissions as mine, so I am not sure why they are being blocked.
Could you look into the 403 issue as well when you have a moment?
I want to make sure the entire team is unblocked before our Friday deadline.`,
  },
  {
    sender: MessageSender.agent,
    body: `Great news that the legacy workaround got exports working for you — thank you for confirming.
You are correct that the legacy PDF renderer does not support cell background colours or conditional formatting; that capability was only added in the v3 renderer.
Unfortunately there is no configuration option to back-port colour support to the legacy engine as they use entirely different rendering pipelines.
For your board presentation I would suggest exporting to Excel (XLSX) format instead, which fully preserves all conditional formatting including your red/green revenue highlights.
You can select XLSX in the same Reports > Settings panel where you changed the PDF option.
Regarding v3.14.2 — I have just confirmed with the engineering team that the patch will restore full conditional formatting support in the new renderer.
The release is on track for tonight at 23:00 UTC, so you should have it available before your Friday session.
On the 403 errors for your colleagues: this is a separate known issue affecting accounts that were migrated during our SSO rollout last month.
Their export permissions need to be refreshed manually on our side; I have already submitted the fix request for both accounts.
You should see the 403 errors resolved within the next two hours without any action needed from your team.
I will send a follow-up message as soon as both accounts are unblocked and again once v3.14.2 goes live.
Please do not hesitate to reply if anything else comes up before your presentation.`,
  },
  {
    sender: MessageSender.customer,
    body: `The XLSX suggestion worked perfectly — all the conditional formatting is intact and the file looks exactly as expected.
This will absolutely work for the presentation tomorrow, so thank you for the quick thinking on that front.
I also wanted to let you know that the 403 errors for my two colleagues have been resolved, as you promised.
They can now export successfully using the legacy PDF workaround just like I can, which is a big relief for the whole team.
I do have a follow-up question about the v3.14.2 patch that is going live tonight.
Will the patch apply automatically to our account, or is there any action required on our end such as clearing a cache or re-logging?
Also, after the patch is applied, should we switch back from "Legacy PDF" to "Auto" in the export settings, or is it safer to leave it on Legacy for now?
I want to make sure we do not break anything right before a critical presentation by switching settings at the wrong time.
Additionally, could you advise on whether the patch affects any other features beyond the export renderer?
We use the scheduled email delivery of reports heavily and I want to make sure that pipeline is not disrupted.
Please also let me know if there is a release notes page I can bookmark to track future updates like this.
Your support today has been outstanding and I truly appreciate the responsiveness.`,
  },
  {
    sender: MessageSender.agent,
    body: `I am delighted to hear the XLSX workaround solved the formatting issue and that your colleagues are unblocked.
To answer your questions about v3.14.2: the patch will be applied automatically at the infrastructure level and no action is required from your team.
You do not need to clear your cache or log out — the new renderer will activate silently on our servers and your next export attempt will use it automatically.
After the patch is live, I would recommend switching back from "Legacy PDF" to "Auto" as the new renderer has several quality improvements over the legacy one.
That said, if you prefer to wait until after your Friday presentation before changing any settings, that is also completely reasonable.
Regarding the scope of the patch: v3.14.2 is a targeted fix and only touches the PDF rendering module.
The scheduled email delivery pipeline uses a separate code path and will not be affected in any way — your automated report emails will continue as normal.
For release notes, you can find the full changelog at our status page under the "Releases" tab; I will also ask our team to send you a direct email summary after tonight's deployment.
I will personally follow up with you tomorrow morning to confirm the patch applied successfully and that PDF exports with full formatting are working.
Is there anything else I can help with before your board presentation?
Once again, I apologise for the initial delay and I am glad we could get everything resolved in time.`,
  },
  {
    sender: MessageSender.customer,
    body: `Thank you so much — this has been one of the best support experiences I have had with any software provider.
I just want to confirm a few things I observed this morning after the patch went live overnight.
I switched the export setting back to "Auto" as you recommended and ran a test export with our full Q1 revenue report.
The PDF downloaded immediately, all conditional formatting is present, and the file size looks correct.
I also asked my two colleagues to run test exports and they both confirmed everything is working on their end as well.
The scheduled email delivery that went out at 07:00 this morning also arrived without any issues, so that pipeline is definitely intact.
There is one very minor thing I noticed: the footer text on the last page of the exported PDF now shows "v3.14.2" instead of "v3.14", which I assume is intentional.
If that version string is configurable and could be removed entirely, that would be ideal for documents we share externally with clients.
But this is absolutely not urgent — please treat it as a low-priority enhancement request rather than a bug.
We are all set for the presentation this afternoon and the team is very grateful for the support we received.
Could you please send me a summary of this incident so I can share it with my IT manager for our records?
Once again, thank you to you and the engineering team for the fast turnaround.`,
  },
  {
    sender: MessageSender.agent,
    body: `That is wonderful to hear — thank you for taking the time to confirm all the test results so thoroughly.
I am very pleased that the PDF export, the conditional formatting, the colleague accounts, and the scheduled email delivery are all functioning correctly.
You are right that the "v3.14.2" version string in the footer is intentional; it is part of our audit trail feature added in this release.
I have logged your request to make the footer version string configurable as a product enhancement ticket with reference ID ENH-4421.
Our product team reviews enhancement requests on a monthly basis and I have added a note indicating your use case for external client documents.
Regarding the incident summary: I have drafted one below for your records.
— Incident Summary —
Date range: April 11–15, 2026.
Impact: PDF export failure for all users on v3.14; 403 export errors for two SSO-migrated accounts.
Root cause: Regression in the v3 PDF renderer introduced in the v3.14 deployment on April 10.
Resolution: Immediate workaround via Legacy PDF and XLSX export; permanent fix deployed in v3.14.2 on April 15 at 23:00 UTC. SSO account permissions refreshed manually.
— End of Summary —
Please feel free to share this with your IT manager.
I will now mark this ticket as resolved, but do not hesitate to reopen it or start a new one if anything further comes up.
It has been a genuine pleasure assisting you and your team.`,
  },
  {
    sender: MessageSender.customer,
    body: `The incident summary is exactly what I needed — thank you for preparing it so promptly.
I have shared it with my IT manager and she was very satisfied with the level of detail and the timeline provided.
The board presentation this afternoon went extremely well and the exported reports looked professional and accurate throughout.
Several board members actually commented on the quality of the formatting, which made the whole ordeal worthwhile in the end.
I did want to raise one small follow-up item before you close the ticket.
When I exported a report with more than 500 rows today, the file took about 45 seconds to generate, whereas before the patch it was closer to 10 seconds.
It is not blocking anything but it does feel noticeably slower, especially for our larger operational reports.
Is this a known side effect of the v3.14.2 changes, or could it be something specific to our account configuration?
I want to flag it now while the context is fresh rather than open a separate ticket later if it turns out to be related.
If it is unrelated to the patch I am happy for you to close this ticket and I will open a fresh one for the performance issue.
Thank you again for everything — your support team has genuinely exceeded my expectations this week.
I will definitely be leaving a positive review on G2 and recommending your platform to our partner organisations.`,
  },
  {
    sender: MessageSender.agent,
    body: `Thank you so much for the kind words and for sharing the positive feedback — it truly means a lot to the whole team.
I am thrilled the board presentation was a success and that the reports made a strong impression.
Regarding the export performance regression you noticed on large reports: this is indeed a known side effect of v3.14.2.
The new renderer performs additional validation passes on each row to ensure formatting integrity, which adds latency on datasets above approximately 300 rows.
Our engineering team is already aware of this trade-off and is working on an optimised rendering pipeline in the upcoming v3.15 release.
The target for v3.15 is to bring export times back to or below pre-v3.14 levels while retaining all the formatting improvements.
In the meantime, if you need to export very large reports quickly, splitting them into multiple smaller reports of under 300 rows each will significantly reduce the wait time.
I have linked your observation to the internal performance tracking ticket so your feedback is on record for the engineering team.
I will keep this ticket open for another 48 hours in case anything else comes up, after which it will auto-resolve.
If the performance issue worsens or you encounter anything else, please do reply here and I will pick it up immediately.
Thank you again for being such a thorough and collaborative customer — feedback like yours genuinely helps us improve the product.
Wishing you and your team continued success.`,
  },
];

async function main() {
  // Fetch the 3rd most-recent ticket
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, subject: true },
  });

  if (tickets.length < 3) {
    console.error(`Only ${tickets.length} ticket(s) found — need at least 3. Run seed:tickets first.`);
    process.exit(1);
  }

  const ticket = tickets[2];
  console.log(`Seeding conversation on ticket: "${ticket.subject}" (${ticket.id})`);

  // Find any agent/admin user to use as the sender for agent messages
  const agentUser = await prisma.user.findFirst({ select: { id: true, name: true } });
  if (!agentUser) {
    console.error('No users found — run seed first.');
    process.exit(1);
  }
  console.log(`Using agent: ${agentUser.name} (${agentUser.id})`);

  // Space messages out by 2 hours each starting from 10 hours ago
  const baseOffset = -(MESSAGES.length * 2);

  for (let i = 0; i < MESSAGES.length; i++) {
    const { sender, body } = MESSAGES[i];
    await prisma.message.create({
      data: {
        body,
        sender,
        ticketId: ticket.id,
        userId: sender === MessageSender.agent ? agentUser.id : null,
        sentAt: hoursFromNow(baseOffset + i * 2),
      },
    });
    console.log(`  [${i + 1}/10] ${sender} message created`);
  }

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
