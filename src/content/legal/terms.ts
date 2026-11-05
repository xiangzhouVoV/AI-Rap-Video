import { supportLink, type LegalPolicy } from "./policy";

export const terms: LegalPolicy = {
  path: "/terms",
  title: "Terms of Service",
  description: "Read the airaptovideo Terms of Service for account rules, portrait permissions, one-time credit purchases, failed generations and use of the videos you create.",
  intro: "These Terms of Service apply when you use airaptovideo to upload a portrait, generate a clip, buy credits or download a result. Read the description of the effect before you start. It tells you what the tool accepts and what kind of clip it can deliver. By using the service, you agree to these terms and confirm you can enter into this agreement.",
  sections: [
    {
      heading: "Using the generator and your account",
      paragraphs: [
        "The site offers photo-based video effects, sample previews and related creative tools. A sample preview illustrates an effect using a prepared clip. A live job processes the references and settings you submit. Available effects, formats and download options can differ by job. An HD download requires an available HD result. Review the preview before you publish a clip or make a purchase.",
        "Use a sign-in account you control and provide accurate contact information for purchases and support. Keep your login and recovery details private. If someone else uses your account without permission, sign out on shared devices, secure the account with your sign-in provider and contact us with the affected job or order reference. We may restrict access while investigating misuse or protecting another person’s photos.",
      ],
    },
    {
      heading: "One-time credits and prices",
      paragraphs: [
        "When checkout is open, website credits are sold in one-time packs. Buying a pack does not start a subscription. There is no automatic renewal or automatic purchase when credits run low. Each additional purchase requires your authorization at checkout. Credits apply to eligible actions on this site. A restricted template may show usage reported by its generation provider separately from website credits.",
        "The order screen shows the pack and price before payment. Check the amount, currency and any taxes shown at Creem before you confirm. We may change prices for future purchases. Your completed order keeps the price you approved. Selecting a pack or looking at a sample preview on its own does not authorize a charge.",
        "If a paid website generation fails completely, any website credits deducted for that failed job will be returned. If the return is missing, send the job reference so we can trace the deduction and correct it. Our Refund Policy covers missing credits, a failure caused by our service and duplicate charges, and explains how a monetary refund differs from a credit return.",
      ],
      links: [{ href: "/refunds", label: "Refund Policy" }],
    },
    {
      heading: "Portrait consent and prohibited uses",
      paragraphs: [
        "Upload a photo of yourself or of an adult who has given you permission for the specific use. Their permission must cover processing the photo with an AI service and any sharing or commercial use you plan for the resulting clip. Permission to take a photograph does not by itself give you permission to animate or publish it. You are responsible for any copyright permission from the photographer as well.",
        "Do not upload portraits of public figures or celebrities, images of minors, or photos of people who have not agreed. Do not submit or create sexually explicit, NSFW, violent or abusive material. Do not impersonate another person, misrepresent an endorsement, or present a generated scene as evidence of an actual event. Do not scrape the site, harvest other users’ media, bypass access controls, or resell access, credits or the generation service.",
      ],
    },
    {
      heading: "Using a result",
      paragraphs: [
        "You retain the rights you already hold in your uploads. You allow us and the providers involved in a job to process, store and deliver your material to carry out your request. Before posting the result, review the portrayal and make sure your intended audience and use fall within the permission you received. Obtain separate rights for music, logos or other material you add later. Generation alone gives you no license to another person’s likeness or work.",
      ],
    },
    {
      heading: "Service limits and resolving a dispute",
      paragraphs: [
        "Results can vary even with the same photo and settings. Keep copies of files you need. To the extent allowed by law, we limit our liability to losses that are a foreseeable, direct consequence of our breach and exclude indirect losses such as lost business opportunities. This limit preserves liability and consumer remedies that applicable law requires, including rights relating to defective digital content.",
        "For a dispute, email a description, the relevant dates and the remedy you seek. We will review the job or purchase with you. If we cannot resolve it, either party may use a court with jurisdiction under the applicable rules. The law governing this agreement is determined by the conflict-of-law rules of that court. Consumers retain mandatory protections and any right to bring a claim where they live.",
      ],
      links: [supportLink],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We publish revisions on this page and update the date at the top. Revisions apply to use after the stated effective date. For changes that materially affect purchases or account rights, we will provide notice before they take effect and obtain consent where required. If you disagree with a change, stop using the affected feature and contact us about your account or an earlier order.",
      ],
    },
  ],
};
