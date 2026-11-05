import { supportLink, type LegalPolicy } from "./policy";

export const cookies: LegalPolicy = {
  path: "/cookies",
  title: "Cookies Policy",
  description: "The airaptovideo Cookies Policy covers session and checkout details, first-party usage events, browser storage lifetimes, and how to clear data on your device.",
  intro: "This Cookies Policy explains which data airaptovideo places in your browser when you visit, sign in or use a generator. A cookie is a small value a browser can send back to the site with a request. We also use browser storage for a few actions that need to remember which task or photo reference you were working with.",
  sections: [
    {
      heading: "Cookies and their lifetimes",
      paragraphs: [
        "The table describes the site’s own cookies, including the session identifier used for first-party measurement. It also identifies two places where you might expect a cookie but where the site sets none. The login cookies have a secure name prefix on the public HTTPS site. Your browser’s site data settings show the entries for your particular visit.",
      ],
      table: {
        columns: ["Cookie or mechanism", "Purpose", "Lifetime"],
        rows: [
          ["Login session (better-auth.session_token)", "Essential for sign-in. Recognizes the signed-in account on requests for its tasks and profile.", "Seven days from issue or refresh. Signing out ends the session."],
          ["Login return state (better-auth.state)", "Essential during Google sign-in. Matches the return to the browser that started the sign-in.", "Up to five minutes, cleared when the return is processed."],
          ["Generator session (arv_session)", "Associates uploads and renders with the right browser. Also used to count first-party usage events.", "Seven days from issue."],
          ["Payment return state", "Checkout uses a return address with a status in the URL. The site sets no separate payment return cookie.", "No cookie lifetime. The return address can stay in browser history."],
          ["Third-party analytics cookies", "The site currently uses no third-party analytics cookies or third-party analytics scripts.", "None set."],
        ],
      },
    },
    {
      heading: "Visiting a page and using an effect",
      paragraphs: [
        "When you visit a page, the site may create the generator session and send a page-view event to its own server. When you upload a photo, complete a generation or open a checkout panel, the site can record the corresponding event. These records include the page path, an identifier derived from the session, and where relevant an upload or job reference and status. The cookie value itself does not contain your photo, generated clip, email address or card details.",
        "The session lets the server check that a request for a regular upload came from the browser that owns it. If you clear the cookie, the same browser can appear to be a new visitor and may lose access to a previous upload. Account-based effects use your sign-in session to retrieve tasks belonging to your account. Signing in again can restore access to account-linked tasks.",
      ],
    },
    {
      heading: "Temporary drafts and task recovery",
      paragraphs: [
        "If you change between compatible effects, session storage can carry the upload reference to the next page in the same tab. A draft can be used for up to 30 minutes and is removed when consumed. The draft contains references and settings, rather than the image file itself. The regular generator can also keep the last job identifier in the tab so that reloading the page can show its progress.",
        "Some signed-in templates store task and request identifiers in local storage. Those identifiers help recover a submission after a lost connection and help avoid starting a second paid job while a first job is still processing. Local storage can survive closing the tab or browser. A recovery record can remain until the application replaces or clears it, or until you remove site data yourself.",
      ],
    },
    {
      heading: "Sign-in and checkout on other sites",
      paragraphs: [
        "Google manages its own pages when you choose to sign in. When paid checkout is available, you enter payment details on Creem’s hosted page. Those providers control cookies on their respective sites and describe them in their own notices. Returning to airaptovideo from checkout can put a return or cancellation indicator in the address bar. That indicator alone does not prove a payment succeeded. Use your receipt and order reference to ask about a charge.",
      ],
    },
    {
      heading: "How to block or remove site data",
      paragraphs: [
        "Open the privacy or site data settings in your browser and search for airaptovideo.app. Choose the site entry to inspect or remove its stored data. To prevent future cookies, use the browser’s cookie permissions or site exceptions to block this site. On a shared device, sign out before clearing data and closing your browser. Browser history and downloaded files may need to be cleared separately.",
        "You can still read public pages with cookies blocked. Upload recovery, sign-in and authenticated generation may require you to allow site data again. Removing local data clears that browser’s copy of an identifier. To ask us to erase a stored photo, job or account, follow the request instructions in our Privacy Policy. If a question concerns a browser entry, include its name and the site shown alongside it. Please keep the actual cookie value private.",
      ],
      links: [{ href: "/privacy", label: "Privacy Policy" }, supportLink],
    },
  ],
};
