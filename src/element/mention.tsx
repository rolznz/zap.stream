import { Link } from "react-router-dom";
import { useUserProfile } from "@snort/system-react";
import { hexToBech32 } from "utils";

interface MentionProps {
  pubkey: string;
  relays?: string[];
}

export function Mention({ pubkey }: MentionProps) {
  const user = useUserProfile(pubkey);
  const npub = hexToBech32("npub", pubkey);
  return <Link to={`/p/${npub}`}>{user?.name || pubkey}</Link>;
}
