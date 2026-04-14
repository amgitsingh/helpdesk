/**
 * seed-tickets.ts
 *
 * Creates 100 realistic support tickets with diverse statuses, categories,
 * senders, and dates so sorting and filtering are meaningful.
 *
 * Usage:
 *   npm run seed:tickets
 */

import 'dotenv/config';
import prisma from './lib/prisma';
import { TicketStatus, TicketCategory } from './generated/prisma/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Sender pool ───────────────────────────────────────────────────────────────

const SENDERS = [
  { name: 'James Carter',    email: 'james.carter@acmecorp.com' },
  { name: 'Sofia Nguyen',    email: 'sofia.nguyen@brightmail.io' },
  { name: 'Marcus Webb',     email: 'marcus.webb@techventures.net' },
  { name: 'Priya Sharma',    email: 'priya.sharma@globalretail.com' },
  { name: 'Oliver Bennett',  email: 'oliver.bennett@freshstart.co' },
  { name: 'Aisha Okonkwo',   email: 'aisha.okonkwo@sunrisemedia.org' },
  { name: 'Lucas Ferreira',  email: 'lucas.ferreira@devstudio.br' },
  { name: 'Hannah Müller',   email: 'hannah.mueller@europeshop.de' },
  { name: 'Raj Patel',       email: 'raj.patel@innovatetech.in' },
  { name: 'Claire Dupont',   email: 'claire.dupont@boutique-paris.fr' },
  { name: 'Daniel Okoro',    email: 'daniel.okoro@finservices.ng' },
  { name: 'Yuki Tanaka',     email: 'yuki.tanaka@digitalwave.jp' },
  { name: 'Emma Johansson',  email: 'emma.johansson@nordic.se' },
  { name: 'Carlos Mendez',   email: 'carlos.mendez@constructora.mx' },
  { name: 'Natalia Popova',  email: 'natalia.popova@cloudops.ru' },
];

// ── Ticket data ───────────────────────────────────────────────────────────────

const TICKETS: Array<{
  subject: string;
  body: string;
  status: TicketStatus;
  category: TicketCategory;
  daysAgo: number;
  senderIndex: number;
}> = [
  // ── Refund Requests ──────────────────────────────────────────────────────────
  {
    subject: 'Refund for cancelled subscription',
    body: 'I cancelled my annual subscription on March 3rd but have not received my pro-rated refund of $89. It has been two weeks now. Order #ORD-88821.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 3, senderIndex: 0,
  },
  {
    subject: 'Double charged on last invoice',
    body: 'Your system charged my credit card twice for the February invoice — once on the 1st and again on the 3rd. Please refund the duplicate charge of $49.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 14, senderIndex: 1,
  },
  {
    subject: 'Item arrived damaged — requesting refund',
    body: 'The laptop stand I ordered arrived with a cracked base. I have attached photos. I would like a full refund rather than a replacement.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 1, senderIndex: 2,
  },
  {
    subject: 'Wrong product delivered',
    body: 'I ordered the 32GB model (SKU-4421) but received the 16GB version. I need the correct item or a refund.',
    status: TicketStatus.closed, category: TicketCategory.refund_request, daysAgo: 45, senderIndex: 3,
  },
  {
    subject: 'Refund not processed after 30 days',
    body: 'I was promised a refund on 15 January. It is now past 30 days and the money has not appeared in my account. Please escalate.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 10, senderIndex: 4,
  },
  {
    subject: 'Accidental purchase — need immediate refund',
    body: 'My child accidentally purchased the Enterprise plan while using my device. I noticed the charge immediately and am requesting a refund.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 0, senderIndex: 5,
  },
  {
    subject: 'Service downtime refund credit',
    body: 'Your platform was down for over 6 hours on April 4th. Per our SLA, we are entitled to a service credit. Please apply it to our account.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 7, senderIndex: 6,
  },
  {
    subject: 'Charged after cancellation',
    body: 'I cancelled my plan on February 28th, yet I was charged $129 on March 1st. Please refund and confirm the cancellation is final.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 21, senderIndex: 7,
  },
  {
    subject: 'Partial refund request for unused months',
    body: 'I upgraded mid-cycle but the system charged me full price for both plans. I expect a partial refund for the unused days on the old plan.',
    status: TicketStatus.closed, category: TicketCategory.refund_request, daysAgo: 60, senderIndex: 8,
  },
  {
    subject: 'Promotional discount not applied — refund difference',
    body: 'I purchased using code SAVE20 but was charged full price. I have a screenshot of the confirmation page showing the discount. Please refund $24.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 2, senderIndex: 9,
  },
  {
    subject: 'Subscription auto-renewed without notice',
    body: 'My annual subscription auto-renewed despite me turning off auto-renew in settings. I want a full refund for the $299 charge.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 4, senderIndex: 10,
  },
  {
    subject: 'Trial converted to paid without consent',
    body: 'The free trial converted to a $49/month paid plan automatically. I was never prompted to confirm. Please cancel and refund.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 18, senderIndex: 11,
  },
  {
    subject: 'Shipping fee refund for delayed delivery',
    body: 'I paid for next-day delivery but the package arrived three days late. I am requesting a refund of the $15 express shipping fee.',
    status: TicketStatus.closed, category: TicketCategory.refund_request, daysAgo: 30, senderIndex: 12,
  },
  {
    subject: 'Event cancelled — refund all tickets',
    body: 'The webinar I registered for on April 10th was cancelled by your team. I purchased four seats at $25 each. Please refund $100.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 9, senderIndex: 13,
  },
  {
    subject: 'VAT refund for non-EU company',
    body: 'Our company is based in Canada, not the EU. We were incorrectly charged VAT on invoice INV-20241102. Please issue a VAT-only refund.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 5, senderIndex: 14,
  },

  // ── Technical Questions ───────────────────────────────────────────────────────
  {
    subject: 'API returns 401 after token rotation',
    body: 'After rotating our API key yesterday the integration returns 401 Unauthorized on every call. We have confirmed the new key in the header. What else should we check?',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 1, senderIndex: 6,
  },
  {
    subject: 'Webhook not firing on order completion',
    body: 'We have set up the order_completed webhook but it never fires. The endpoint is reachable (returns 200) and the URL is saved correctly in the dashboard.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 2, senderIndex: 7,
  },
  {
    subject: 'SSO SAML configuration not working',
    body: 'We followed the SAML 2.0 setup guide but users receive "Invalid assertion" on login. Our IdP is Okta. I can share the metadata XML if needed.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 12, senderIndex: 8,
  },
  {
    subject: 'CSV import fails on row 247',
    body: 'Every time I upload our customer CSV the import aborts at row 247 with error "Invalid date format". The date column uses YYYY-MM-DD which the docs say is supported.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 3, senderIndex: 9,
  },
  {
    subject: 'Mobile app crashes on iOS 17.4',
    body: 'Since updating to iOS 17.4, the app crashes immediately on launch. I have tried reinstalling. Other users on our team report the same issue.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 20, senderIndex: 10,
  },
  {
    subject: 'Email notifications not delivering',
    body: 'Our users have stopped receiving email notifications. We have not changed any settings. The emails do not appear in spam either.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 1, senderIndex: 11,
  },
  {
    subject: 'Rate limit hit with normal usage',
    body: 'We are hitting 429 errors at only 80 requests per minute, well below our plan limit of 500 req/min. Is there a secondary rate limit we are not aware of?',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 0, senderIndex: 12,
  },
  {
    subject: 'Two-factor authentication codes not working',
    body: 'Several team members cannot log in because their TOTP codes are rejected. Our server time is synced. This started happening after last night\'s maintenance window.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 8, senderIndex: 13,
  },
  {
    subject: 'Data export missing custom fields',
    body: 'When exporting contacts to CSV, the custom fields our team added (e.g. "Account Tier", "Region") are not included. Only the default fields appear.',
    status: TicketStatus.closed, category: TicketCategory.technical_question, daysAgo: 50, senderIndex: 14,
  },
  {
    subject: 'OAuth redirect URI mismatch',
    body: 'Our OAuth integration fails with "redirect_uri_mismatch". The URI in our app settings matches exactly, including the trailing slash.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 2, senderIndex: 0,
  },
  {
    subject: 'Dashboard loading very slowly',
    body: 'The main dashboard takes 15–20 seconds to load since last Wednesday. Our internet connection is fine and other sites are fast.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 6, senderIndex: 1,
  },
  {
    subject: 'Bulk delete API endpoint returning 500',
    body: 'Calling DELETE /api/v2/records/bulk with a list of 50 IDs returns a 500 error. Smaller batches of 10 work fine.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 4, senderIndex: 2,
  },
  {
    subject: 'Search indexing not updating in real time',
    body: 'New records appear in search results after a 10–15 minute delay. We expected near-real-time indexing as described in your docs.',
    status: TicketStatus.closed, category: TicketCategory.technical_question, daysAgo: 90, senderIndex: 3,
  },
  {
    subject: 'Cannot connect to database via SSL',
    body: 'Our integration fails to connect with sslmode=require. Without SSL it works. We need SSL for compliance. Certificate is from a trusted CA.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 16, senderIndex: 4,
  },
  {
    subject: 'Zapier integration stopped syncing',
    body: 'Our Zap was working for months but stopped syncing new records three days ago. The Zap is on and shows no errors in Zapier\'s history.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 3, senderIndex: 5,
  },
  {
    subject: 'Pagination cursor returns duplicate records',
    body: 'When iterating through pages using the cursor-based pagination API, some records appear on both page N and page N+1.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 25, senderIndex: 6,
  },
  {
    subject: 'File upload fails over 10 MB',
    body: 'Uploading files larger than 10 MB fails with a 413 error. Our plan documentation states the limit is 50 MB.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 1, senderIndex: 7,
  },
  {
    subject: 'Custom domain SSL certificate not provisioning',
    body: 'I pointed my CNAME to your servers 48 hours ago but the SSL certificate has not been provisioned. The domain shows "certificate pending".',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 2, senderIndex: 8,
  },
  {
    subject: 'Scheduled reports not sending on weekends',
    body: 'Weekly reports set to deliver on Saturdays are not arriving. The schedule is correct in settings. Weekday reports work fine.',
    status: TicketStatus.closed, category: TicketCategory.technical_question, daysAgo: 70, senderIndex: 9,
  },
  {
    subject: 'GraphQL subscription disconnects after 60 seconds',
    body: 'Our GraphQL subscriptions disconnect exactly 60 seconds after connecting. This happens consistently, regardless of activity.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 0, senderIndex: 10,
  },
  {
    subject: 'Audit log missing events from last month',
    body: 'Our compliance team noticed audit log entries are missing for the period March 1–31. Was there a data retention policy change?',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 11, senderIndex: 11,
  },
  {
    subject: 'Cannot remove admin role from user',
    body: 'Trying to demote an admin to a regular user fails with "Insufficient permissions" even though I am the account owner.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 5, senderIndex: 12,
  },
  {
    subject: 'Dark mode breaks table rendering',
    body: 'When dark mode is enabled in user preferences, the data tables show white text on white background. This was not an issue before the last update.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 19, senderIndex: 13,
  },
  {
    subject: 'IP allowlist not blocking unauthorised access',
    body: 'We configured an IP allowlist in security settings, but we can still log in from IP addresses not on the list.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 6, senderIndex: 14,
  },
  {
    subject: 'Batch API job stuck in "processing" state',
    body: 'A batch job submitted 18 hours ago is still showing status "processing". The job contains 2,000 records which should complete in minutes.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 1, senderIndex: 0,
  },

  // ── General Questions ─────────────────────────────────────────────────────────
  {
    subject: 'How do I add team members to my account?',
    body: 'I have a team plan but cannot figure out how to invite colleagues. I went to Settings > Team but the invite button appears greyed out.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 7, senderIndex: 1,
  },
  {
    subject: 'What is the difference between the Pro and Business plans?',
    body: 'The pricing page lists features for both plans but I am not clear on the API rate limits and user seat differences. Can you clarify?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 55, senderIndex: 2,
  },
  {
    subject: 'Can I export my data before cancelling?',
    body: 'I am considering cancelling my subscription and want to export all my data first. What formats are available and how long does the export take?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 13, senderIndex: 3,
  },
  {
    subject: 'Is there a mobile app for Android?',
    body: 'I can find the iOS app but cannot locate an Android version on the Play Store. Is Android support planned?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 80, senderIndex: 4,
  },
  {
    subject: 'How do I change my billing currency?',
    body: 'We are based in the UK and would like to be billed in GBP rather than USD. Is this possible without creating a new account?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 22, senderIndex: 5,
  },
  {
    subject: 'Do you offer a non-profit discount?',
    body: 'We are a registered non-profit organisation (501c3). Do you have a discount programme for non-profits and how do we apply?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 4, senderIndex: 6,
  },
  {
    subject: 'Where can I find my invoices?',
    body: 'My accounting team is asking for invoices from the past 12 months. I checked the billing section but can only see the current month.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 15, senderIndex: 7,
  },
  {
    subject: 'Can I pause my subscription instead of cancelling?',
    body: 'I need to step away for two months due to a personal situation. Is there a way to pause my account and resume without losing my data?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 2, senderIndex: 8,
  },
  {
    subject: 'Is there an affiliate or referral programme?',
    body: 'I have several clients who could benefit from your product. Do you run an affiliate programme and what are the commission terms?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 100, senderIndex: 9,
  },
  {
    subject: 'What happens to my data when my trial expires?',
    body: 'My free trial ends in three days and I have not decided whether to subscribe. Is my data deleted immediately or is there a grace period?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 9, senderIndex: 10,
  },
  {
    subject: 'Can I transfer ownership of my account?',
    body: 'I am leaving the company and need to transfer the account owner role to my colleague. How do I do this without losing any data?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 3, senderIndex: 11,
  },
  {
    subject: 'Are there usage limits on the Starter plan?',
    body: 'I am on the Starter plan and want to know the exact limits for records, API calls, and file storage before I hit any caps.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 17, senderIndex: 12,
  },
  {
    subject: 'Do you support GDPR data deletion requests?',
    body: 'A customer has submitted a right-to-erasure request under GDPR. How do we ensure all their data is deleted from your platform?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 1, senderIndex: 13,
  },
  {
    subject: 'How do I update the credit card on file?',
    body: 'My company issued a new corporate card. Where do I update the payment method? I cannot find the option in billing settings.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 24, senderIndex: 14,
  },
  {
    subject: 'Can multiple users share a single login?',
    body: 'We only have budget for one seat but three people need access. Can we share credentials or is there a lower-cost option for read-only users?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 65, senderIndex: 0,
  },
  {
    subject: 'What uptime SLA do you guarantee?',
    body: 'Before we sign an enterprise contract, our legal team needs the exact uptime SLA percentage and the compensation terms for outages.',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 5, senderIndex: 1,
  },
  {
    subject: 'Is training or onboarding available?',
    body: 'We just signed up for the Business plan with 20 users. Do you offer live onboarding sessions or a structured training programme?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 29, senderIndex: 2,
  },
  {
    subject: 'How do I delete my account permanently?',
    body: 'I would like to permanently delete my account and all associated data. Please advise on the steps and whether there is a waiting period.',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 40, senderIndex: 3,
  },
  {
    subject: 'Can I white-label the product for my clients?',
    body: 'We are an agency and want to offer your platform under our brand. Do you offer white-label or reseller options at the enterprise tier?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 6, senderIndex: 4,
  },
  {
    subject: 'What payment methods do you accept?',
    body: 'We need to pay by bank transfer (ACH) rather than credit card due to our procurement policy. Is this an option on annual plans?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 31, senderIndex: 5,
  },
  {
    subject: 'How long is data retained after account deletion?',
    body: 'Per our data governance policy, we need to know exactly how long you retain data after an account is closed or deleted.',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 75, senderIndex: 6,
  },
  {
    subject: 'Is there a public API changelog?',
    body: 'We need to track breaking changes to the API to plan our maintenance windows. Is there a public changelog or RSS feed we can subscribe to?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 0, senderIndex: 7,
  },
  {
    subject: 'Can I get a purchase order invoice?',
    body: 'Our finance team requires a PO invoice before payment. Can you generate one with our PO number (PO-2024-0088) included?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 26, senderIndex: 8,
  },
  {
    subject: 'How do I set up two-factor authentication?',
    body: 'Our IT policy now requires 2FA for all SaaS tools. I can see the option in security settings but the QR code is not loading.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 33, senderIndex: 9,
  },
  {
    subject: 'Is there a sandbox or test environment?',
    body: 'Before going live we want to test our integration thoroughly without affecting production data. Do you provide a sandbox environment?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 8, senderIndex: 10,
  },
  {
    subject: 'Can I change my plan mid-cycle?',
    body: 'We need to upgrade from Pro to Business immediately because we are onboarding a large client next week. How is the billing handled?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 36, senderIndex: 11,
  },
  {
    subject: 'Do you have a status page?',
    body: 'During our last review meeting someone asked if there is a public status page we can monitor for incidents. Is there one?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 85, senderIndex: 12,
  },
  {
    subject: 'How do I reset a team member\'s password?',
    body: 'One of our agents is locked out and the self-service reset email is not arriving. As admin, can I force reset their password?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 2, senderIndex: 13,
  },
  {
    subject: 'What data centres do you use?',
    body: 'Our legal team needs to know which regions and data centres store our data for regulatory compliance documentation.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 38, senderIndex: 14,
  },
  {
    subject: 'Is there a student or academic discount?',
    body: 'I am a PhD researcher using your platform for data collection. Do you offer academic or student pricing?',
    status: TicketStatus.open, category: TicketCategory.general_question, daysAgo: 4, senderIndex: 0,
  },
  // ── Additional mixed tickets ───────────────────────────────────────────────────
  {
    subject: 'Cannot see historical analytics data',
    body: 'The analytics dashboard only shows data for the past 30 days. I need to access reports going back 18 months. Is there an archive or export option?',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 3, senderIndex: 1,
  },
  {
    subject: 'Team member cannot access shared workspace',
    body: 'I invited a colleague to our workspace last week. They accepted the invite but when they log in they see an empty account, not our shared workspace.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 11, senderIndex: 2,
  },
  {
    subject: 'Refund for fraudulent charge on account',
    body: 'We detected an unauthorised charge of $349 on our account from a card we did not authorise. We believe the account was compromised. Please investigate and refund.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 0, senderIndex: 3,
  },
  {
    subject: 'Reports not generating in PDF format',
    body: 'When I select "Export as PDF" the download starts but the file is corrupt and cannot be opened. Excel exports work fine.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 1, senderIndex: 4,
  },
  {
    subject: 'How do I set up automated backups?',
    body: 'We want to configure nightly automated backups of our data. The documentation mentions a backup feature but I cannot find it in the settings.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 42, senderIndex: 5,
  },
  {
    subject: 'Notification emails going to junk folder',
    body: 'Our users consistently find notification emails from your platform in their spam folder. Can you provide SPF/DKIM records we can add to our domain?',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 5, senderIndex: 6,
  },
  {
    subject: 'Requesting refund for failed transaction that was still charged',
    body: 'A payment showed "Transaction Failed" on your end but my bank confirmed the charge went through. I have the bank statement as proof.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 23, senderIndex: 7,
  },
  {
    subject: 'Can I integrate with Salesforce?',
    body: 'We use Salesforce CRM and want to sync customer records both ways. Is there a native integration or do we need to use Zapier?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 95, senderIndex: 8,
  },
  {
    subject: 'Password reset link expired before I could use it',
    body: 'I requested a password reset but had a meeting and by the time I clicked the link it had expired. How long are reset links valid?',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 28, senderIndex: 9,
  },
  {
    subject: 'Downgrade plan and get prorated refund',
    body: 'We are scaling down and need to move from Business to Pro. Can we do this mid-cycle and receive a pro-rated credit for the difference?',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 6, senderIndex: 10,
  },
  {
    subject: 'API documentation link returns 404',
    body: 'The link to the API reference in your onboarding email leads to a 404 page. Please share the correct URL for the v2 API documentation.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 44, senderIndex: 11,
  },
  {
    subject: 'Timezone settings not saving correctly',
    body: 'I set my account timezone to JST (UTC+9) but all timestamps still display in UTC. I have tried saving three times.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 2, senderIndex: 12,
  },
  {
    subject: 'Refund for workshop that was rescheduled without notice',
    body: 'I booked a place on your live workshop for March 15th. It was rescheduled to April without any communication. The new date does not work for me.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 7, senderIndex: 13,
  },
  {
    subject: 'How do I integrate with Slack?',
    body: 'I want to receive alert notifications in our company Slack channel. I can see Slack listed as an integration but cannot find the setup steps.',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 110, senderIndex: 14,
  },
  {
    subject: 'Login page returns blank screen on Firefox',
    body: 'The login page displays a blank white screen when accessed from Firefox 124. Chrome and Edge work fine. This affects all users on our team using Firefox.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 34, senderIndex: 0,
  },
  {
    subject: 'Request for W-9 tax form',
    body: 'Our accounts payable team requires a completed W-9 form from you before processing payment. Can you provide one?',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 48, senderIndex: 1,
  },
  {
    subject: 'Concurrent login sessions being terminated',
    body: 'Users are being logged out when a colleague logs in on another device. We need multiple sessions open simultaneously — is this a plan limitation?',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 1, senderIndex: 2,
  },
  {
    subject: 'Refund for hardware bundle — item missing',
    body: 'The hardware bundle I ordered was missing the USB-C cable that is shown in the product listing. I want a refund for the missing item or the cable sent.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 3, senderIndex: 3,
  },
  {
    subject: 'How often is the platform updated?',
    body: 'We are planning a large integration project and need to know the release cadence to account for potential breaking changes.',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 120, senderIndex: 4,
  },
  {
    subject: 'Custom roles and permissions not saving',
    body: 'I created a custom role with specific permissions and assigned it to a user. After saving, the permissions revert to defaults when I check again.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 4, senderIndex: 5,
  },
  {
    subject: 'Can I get an itemised invoice for tax purposes?',
    body: 'Our accountant needs an invoice that separately lists the base subscription cost and applicable taxes. The current invoices show only a total.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 52, senderIndex: 6,
  },
  {
    subject: 'Import API ignoring date field',
    body: 'When using the bulk import API, the created_date field I send is ignored and the records are always created with today\'s date.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 2, senderIndex: 7,
  },
  {
    subject: 'Account locked after too many failed logins',
    body: 'My account got locked after five failed login attempts (typos). The unlock email has not arrived after 30 minutes. Please unlock my account.',
    status: TicketStatus.resolved, category: TicketCategory.technical_question, daysAgo: 37, senderIndex: 8,
  },
  {
    subject: 'Refund request: service not as advertised',
    body: 'The marketing automation features on your sales page do not match what is actually available in the product. I feel misled and would like a full refund.',
    status: TicketStatus.open, category: TicketCategory.refund_request, daysAgo: 5, senderIndex: 9,
  },
  {
    subject: 'Does the platform support multiple languages?',
    body: 'We are expanding to markets in France, Germany, and Brazil. Does the interface support localisation, or is English the only option?',
    status: TicketStatus.closed, category: TicketCategory.general_question, daysAgo: 130, senderIndex: 10,
  },
  {
    subject: 'Print layout breaks on A4 paper size',
    body: 'When printing reports, the layout is designed for US Letter. Content is cut off on A4. Is there a way to change the print paper size?',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 0, senderIndex: 11,
  },
  {
    subject: 'Annual renewal invoice not received',
    body: 'My subscription auto-renewed last week but I have not received the renewal invoice by email. I need it for our finance records.',
    status: TicketStatus.resolved, category: TicketCategory.general_question, daysAgo: 41, senderIndex: 12,
  },
  {
    subject: 'Webhook payload missing nested objects',
    body: 'The order_updated webhook payload we receive is missing the line_items array that is documented in your webhook reference guide.',
    status: TicketStatus.open, category: TicketCategory.technical_question, daysAgo: 3, senderIndex: 13,
  },
  {
    subject: 'Refund for duplicate annual subscriptions',
    body: 'Due to a browser error, I accidentally created two annual subscriptions for the same account. One is unused and needs to be refunded.',
    status: TicketStatus.resolved, category: TicketCategory.refund_request, daysAgo: 27, senderIndex: 14,
  },
];

// ── Seed function ─────────────────────────────────────────────────────────────

async function seed() {
  // Fetch existing users to assign some tickets to agents
  const agents = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const assignableIds = agents.map((u) => u.id);

  let created = 0;

  for (let i = 0; i < TICKETS.length; i++) {
    const t = TICKETS[i];
    const sender = SENDERS[t.senderIndex % SENDERS.length];

    // Assign roughly one third of tickets to a random agent
    const assignedToId =
      i % 3 === 0 && assignableIds.length > 0
        ? assignableIds[i % assignableIds.length]
        : null;

    await prisma.ticket.create({
      data: {
        subject: t.subject,
        body: t.body,
        senderEmail: sender.email,
        senderName: sender.name,
        status: t.status,
        category: t.category,
        assignedToId,
        createdAt: daysAgo(t.daysAgo),
      },
    });

    created++;
  }

  console.log(`Created ${created} tickets.`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
