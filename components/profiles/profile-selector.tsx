"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { Profile } from "@/lib/api/profiles";
import { cn } from "@/lib/utils";

interface ProfileSelectorProps {
  profiles: Profile[];
}

export function ProfileSelector({ profiles }: ProfileSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProfileId = searchParams.get("profileId");

  function handleSelect(profileId: string) {
    const params = new URLSearchParams(searchParams);
    params.set("profileId", profileId);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <ul className="space-y-2 text-sm">
      {profiles.map((profile) => {
        const isActive = profile.id === activeProfileId;
        return (
          <li
            key={profile.id}
            className={cn(
              "p-2 rounded-md cursor-pointer transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
            onClick={() => handleSelect(profile.id)}
          >
            <div className="font-medium">
              {profile.name ?? profile.user_identifier}
            </div>
            {profile.course_slug && (
              <div className="text-xs text-muted-foreground">
                {profile.course_slug}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}




