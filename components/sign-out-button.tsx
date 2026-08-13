import { SignOut } from "@phosphor-icons/react/dist/ssr";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <SignOut weight="bold" />
        <span className="hidden sm:inline">Sign out</span>
        <span className="sr-only sm:hidden">Sign out</span>
      </Button>
    </form>
  );
}
