import { Separator } from "@/components/ui/separator";

import { AccountInfoCard } from "./components/account-info-card";
import { DangerZoneCard } from "./components/danger-zone-card";
import { FinancialAccountsCard } from "./components/financial-accounts-card";
import { FinancialProfileCard } from "./components/financial-profile-card";
import { PreferencesCard } from "./components/preferences-card";
import { ProfileHeader } from "./components/profile-header";

export default function ProfilePage() {
  return (
    <div className="max-w-lg space-y-6">
      <ProfileHeader />
      <AccountInfoCard />
      <Separator />
      <FinancialProfileCard />
      <Separator />
      <FinancialAccountsCard />
      <Separator />
      <PreferencesCard />
      <Separator />
      <DangerZoneCard />
    </div>
  );
}
