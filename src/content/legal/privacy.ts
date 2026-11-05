import { supportLink, type LegalPolicy } from "./policy";

export const privacy: LegalPolicy = {
  path: "/privacy",
  title: "Privacy Policy",
  description: "The airaptovideo Privacy Policy explains how we handle uploaded photos, generated videos, account and payment records, and requests to access or erase data.",
  intro: "This Privacy Policy explains what happens to a portrait when you upload it to airaptovideo, what we keep about a generation or purchase, and how to ask us for a copy or for deletion. You can read the public pages without signing in. The information we need depends on whether you browse an effect, upload a photo, run a job, or contact support.",
  sections: [
    {
      heading: "Accounts, photos and generation records",
      paragraphs: [
        "When you sign in with Google, we receive account information including your email address, a sign-in identifier and basic profile details such as your name. We use these details to recognize your account and protect access to its tasks. If you leave an email address with a generation, we save it on that job record. The current generator does not send automatic email updates.",
        "An upload includes the image you choose and information needed to read it, such as its format and dimensions. For a live generation we process the image, effect, settings and job identifier. A generation record can include timestamps, progress, errors, the resulting video and any recorded credit usage or returns. A sample preview can display a prepared clip without sending your portrait to an AI generation provider.",
      ],
    },
    {
      heading: "How long photos and results are kept",
      paragraphs: [
        "At upload, we convert photos into a working image and discard the original file bytes after conversion. The regular generator accepts the working image for 24 hours after upload. For signed-in template jobs, the link that lets a generation provider read the image expires 24 hours after upload. The stored working copy can outlast that link, including in your account’s template media.",
        "We retain account-linked working images and saved generation results until you request their deletion or delete the account. For uploads made without an account, there is no scheduled deletion of the working image. It can remain in storage after the 24-hour access period until we identify it for removal in response to your request. Send the upload reference or job ID if you have it. We remove identified photos and saved results from active storage within 30 days after verifying your deletion request, except where a legal obligation requires us to keep a specific record. We explain any such exception in our reply. Deleting a result here does not remove a copy that someone has already downloaded or shared elsewhere.",
      ],
    },
    {
      heading: "Visits and service providers",
      paragraphs: [
        "Our hosting and account services receive technical details such as the IP address, browser user agent, request time and requested path. We use these details to deliver pages, protect accounts, limit abusive requests and investigate faults. The site also records first-party events such as a page view, completed upload, generation outcome or checkout opening with a session identifier. Our Cookies Policy describes the browser data used for those events.",
        "Cloudflare provides hosting, network protection, image processing and storage. Google handles Google sign-in and receives requests for web fonts. Third-party AI generation providers receive the inputs and settings needed to run a live job. Our email service providers handle the messages you send to support and our replies. Include only details needed to answer a support question when writing to us.",
      ],
      links: [{ href: "/cookies", label: "Cookies Policy" }],
    },
    {
      heading: "Orders and payment details",
      paragraphs: [
        "When paid checkout is available, Creem handles payment through its hosted checkout. You enter your payment details there. We do not store full payment card numbers or security codes. We use the order reference, contact email, amount, payment status and related credit records to deliver the purchase, reconcile a missing balance, or investigate a duplicate charge. Financial records may have to be kept after account deletion for tax reporting or an open dispute.",
      ],
    },
    {
      heading: "Your rights and how to contact us",
      paragraphs: [
        "You can ask to access, correct, export or delete your personal data. Write from the email associated with your account when possible, identify the job or upload concerned, and tell us the action you want. For an export, say whether you need account information, generation records, or both. We may ask for details to verify ownership before releasing a file. Please keep passwords, session cookies and full payment card details out of the request.",
        "Where the GDPR applies, we process information to provide the service you request, meet legal duties, and pursue legitimate interests such as keeping accounts secure. Where processing depends on consent, you may withdraw it. Subject to the applicable conditions, you can request portability or restriction, object to processing and complain to your local data protection authority.",
        "Where the CCPA applies, California residents may request disclosure of the categories and specific pieces of information collected, correction or deletion, and exercise applicable rights concerning sale, sharing or sensitive information. We do not sell personal information or share it for cross-context behavioral advertising. We honor applicable requests without discrimination. An authorized agent can write on your behalf with evidence of permission.",
      ],
      links: [
        supportLink,
        { href: "https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en", label: "European Commission guidance on individual rights" },
        { href: "https://oag.ca.gov/privacy/ccpa", label: "California Department of Justice guidance on the CCPA" },
      ],
    },
  ],
};
