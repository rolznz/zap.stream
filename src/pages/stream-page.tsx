import "./stream-page.css";
import { NostrLink, TaggedNostrEvent } from "@snort/system";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

import { LiveVideoPlayer } from "element/live-video-player";
import { eventToLink, findTag, getEventFromLocationState, getHost } from "utils";
import { Profile, getName } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { useLogin } from "hooks/login";
import { useZapGoal } from "hooks/goals";
import { StreamState, System } from "index";
import { SendZapsDialog } from "element/send-zap";
import { NostrEvent } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { NewStreamDialog } from "element/new-stream";
import { Tags } from "element/tags";
import { StatePill } from "element/state-pill";
import { StreamCards } from "element/stream-cards";
import { formatSats } from "number";
import { StreamTimer } from "element/stream-time";
import { ShareMenu } from "element/share-menu";
import { ContentWarningOverlay, isContentWarningAccepted } from "element/content-warning";
import { useCurrentStreamFeed } from "hooks/current-stream-feed";
import { useStreamLink } from "hooks/stream-link";
import { FormattedMessage } from "react-intl";

function ProfileInfo({ ev, goal }: { ev?: NostrEvent; goal?: TaggedNostrEvent }) {
  const login = useLogin();
  const navigate = useNavigate();
  const host = getHost(ev);
  const profile = useUserProfile(host);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  const status = findTag(ev, "status") ?? "";
  const isMine = ev?.pubkey === login?.pubkey;

  async function deleteStream() {
    const pub = login?.publisher();
    if (pub && ev) {
      const evDelete = await pub.delete(ev.id);
      console.debug(evDelete);
      System.BroadcastEvent(evDelete);
      navigate("/");
    }
  }

  const viewers = Number(findTag(ev, "current_participants") ?? "0");
  return (
    <>
      <div className="flex f-center info">
        <div className="f-grow stream-info">
          <h1>{findTag(ev, "title")}</h1>
          <p>{findTag(ev, "summary")}</p>
          <div className="tags">
            <StatePill state={status as StreamState} />
            {viewers > 0 && (
              <span className="pill viewers">
                <FormattedMessage defaultMessage="{n} viewers" values={{ n: formatSats(viewers) }} />
              </span>
            )}
            {status === StreamState.Live && (
              <span className="pill">
                <StreamTimer ev={ev} />
              </span>
            )}
            {ev && <Tags ev={ev} />}
          </div>
          {isMine && (
            <div className="actions">
              {ev && <NewStreamDialog text="Edit" ev={ev} btnClassName="btn" />}
              <AsyncButton type="button" className="btn btn-warning" onClick={deleteStream}>
                <FormattedMessage defaultMessage="Delete" />
              </AsyncButton>
            </div>
          )}
        </div>
        <div className="profile-info">
          <Profile pubkey={host ?? ""} />
          <div className="flex g12">
            {ev && (
              <>
                <ShareMenu ev={ev} />
                {zapTarget && (
                  <SendZapsDialog
                    lnurl={zapTarget}
                    pubkey={host}
                    aTag={`${ev.kind}:${ev.pubkey}:${findTag(ev, "d")}`}
                    eTag={goal?.id}
                    targetName={getName(ev.pubkey, profile)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function StreamPageHandler() {
  const location = useLocation();
  const evPreload = getEventFromLocationState(location.state);
  const link = useStreamLink();

  if (link) {
    return <StreamPage link={link} evPreload={evPreload} />;
  }
}

export function StreamPage({ link, evPreload }: { evPreload?: NostrEvent; link: NostrLink }) {
  const ev = useCurrentStreamFeed(link, true, evPreload);
  const host = getHost(ev);
  const evLink = ev ? eventToLink(ev) : undefined;
  const goal = useZapGoal(findTag(ev, "goal"));

  const title = findTag(ev, "title");
  const summary = findTag(ev, "summary");
  const image = findTag(ev, "image");
  const status = findTag(ev, "status");
  const stream = status === StreamState.Live ? findTag(ev, "streaming") : findTag(ev, "recording");
  const contentWarning = findTag(ev, "content-warning");
  const tags = ev?.tags.filter(a => a[0] === "t").map(a => a[1]) ?? [];

  if (contentWarning && !isContentWarningAccepted()) {
    return <ContentWarningOverlay />;
  }

  const descriptionContent = [title, (summary?.length ?? 0) > 0 ? summary : "Nostr live streaming", ...tags].join(", ");
  return (
    <div className="stream-page">
      <Helmet>
        <title>{`${title} - zap.stream`}</title>
        <meta name="description" content={descriptionContent} />
        <meta property="og:url" content={`https://${window.location.host}/${link.encode()}`} />
        <meta property="og:type" content="video" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={descriptionContent} />
        <meta property="og:image" content={image ?? ""} />
      </Helmet>
      <div className="video-content">
        <LiveVideoPlayer stream={stream} poster={image} status={status} />
        <ProfileInfo ev={ev} goal={goal} />
        <StreamCards host={host} />
      </div>
      <LiveChat link={evLink ?? link} ev={ev} goal={goal} />
    </div>
  );
}
