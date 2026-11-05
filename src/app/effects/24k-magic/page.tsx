import CruiseDancePage, { cruiseMetadata } from "./cruise-dance-page";

export const metadata = cruiseMetadata(5);

export default function Page() {
  return <CruiseDancePage version={5} />;
}
