import { LandingPage } from "@/features/landing/landing-page";
import { getSessionUser } from "@/server/session";

export default async function HomePage() {
  const user = await getSessionUser();
  return <LandingPage signedIn={Boolean(user)} />;
}
