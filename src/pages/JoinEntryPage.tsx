import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * `/join` — enter an invite code, then continue to `/join/:code`.
 */
const JoinEntryPage = () => {
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = raw.trim().toUpperCase().replace(/\s+/g, "");
    if (code.length < 4) return;
    navigate(`/join/${encodeURIComponent(code)}`, { replace: true });
  };

  return (
    <main className="container mx-auto max-w-md px-4 py-12 md:py-16">
      <h1 className="font-heading text-2xl text-foreground">Join with invite</h1>
      <p className="font-body text-sm text-muted-foreground mt-2">Enter the code your instructor shared.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="e.g. ABC12XY"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="rounded-xl h-12 font-mono text-base tracking-wide"
          aria-label="Invite code"
        />
        <Button type="submit" className="w-full rounded-full h-12 text-base" disabled={raw.trim().length < 4}>
          Continue
        </Button>
      </form>
      <p className="mt-8 text-center">
        <Link to="/" className="font-body text-sm text-accent hover:underline">
          Back to discover
        </Link>
      </p>
    </main>
  );
};

export default JoinEntryPage;
