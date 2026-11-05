import { supportLink, type LegalPolicy } from "./policy";

export const refunds: LegalPolicy = {
  path: "/refunds",
  title: "Refund Policy",
  description: "Use the airaptovideo Refund Policy to report missing credits, failed paid jobs or duplicate charges. Find the details to send and when to expect a response.",
  intro: "This Refund Policy applies to one-time website credit packs purchased through Creem when paid checkout is available. It explains when we refund a payment, how to report a failed paid job and how to find out what happened to a charge. If you only viewed a sample or opened the pack selector, there is no completed purchase to refund.",
  sections: [
    {
      heading: "Completed digital goods",
      paragraphs: [
        "A credit pack is a digital purchase. Generation uses computing resources to create a result from the photo and settings you chose. Once the generation succeeds and the agreed result is delivered, disliking its appearance alone does not qualify for a refund. For example, you may prefer a different pose, expression or framing. Please use an available preview to assess the effect before making a purchase.",
        "If a job is marked successful but the promised file cannot be opened or was never delivered, report the technical problem. We will check whether the file is accessible and whether the service delivered the purchase as described. Your rights under applicable consumer law, including remedies for defective digital goods, continue to apply.",
      ],
    },
    {
      heading: "Three situations that qualify for a refund",
      paragraphs: [
        "Payment succeeded but the credits never arrived. Send the Creem receipt and the email used for the order. We will match the completed transaction to the credit record. If the credits are missing, you may request a refund for the undelivered purchase. Tell us if you would prefer us to deliver the missing credits instead.",
        "A fault in our service caused a paid task to fail completely and the deducted website credits were never returned. Send the task reference and any failure message. We will check the final status and credit entries. You may request a refund for the affected paid amount or ask to have the credits restored. A pending render needs a final status before we can determine the loss.",
        "You were charged twice for the same purchase. Send the references for both completed charges, or their dates and amounts if you only received one receipt. We refund the duplicate charge after matching the transactions. An authorization still shown as pending may disappear without a completed debit. We can help you distinguish a pending entry from two settled payments.",
      ],
    },
    {
      heading: "What to include in your request",
      paragraphs: [
        "Email support with the checkout email, Creem order or transaction reference, purchase date, pack purchased, amount and currency. For a failed job, include the generation ID, approximate time of failure and any record of credits already returned. Explain which charge or deduction you want reviewed. If you used a different address to sign in, include it so we can locate the right account.",
        "A cropped screenshot can help if it shows a status or error you cannot copy. Hide unrelated transactions, private photos and bank details. Support does not need your password, full card number or security code. If you cannot find an identifier, describe what you saw and send the information you have. We will tell you what else is needed to trace the payment.",
      ],
      links: [supportLink],
    },
    {
      heading: "Review time and return of funds",
      paragraphs: [
        "We review complete requests within five business days. We will email the decision or explain what information is still needed to finish the review. When we approve a monetary refund, we submit it through Creem to the original payment method and confirm the affected amount. Your bank or payment provider determines when the credit appears on your statement. Keep the confirmation if you need to trace it with your bank.",
        "Restoring website credits adds usable credits back to the affected balance. A monetary refund returns funds to the payment account and reverses the corresponding purchase or affected portion. We reconcile any earlier credit return and explain the adjustment so that the same loss is remedied once. No renewal needs to be canceled because the packs are one-time purchases.",
      ],
    },
    {
      heading: "If you disagree with our decision",
      paragraphs: [
        "Reply to the decision email with the part you dispute and any missing receipt or job details. We will review the evidence and give you the reason for our decision in writing. For a payment that remains unresolved, contact Creem using the support information on your receipt or contact your payment provider about its dispute process. If a bank dispute is already open, include its reference so that the same charge can be traced through the appropriate channel.",
      ],
    },
  ],
};
