import "./stream-page.css";
import { useRef, useState, useLayoutEffect } from "react";
import { parseNostrLink, EventPublisher } from "@snort/system";
import { useNavigate, useParams } from "react-router-dom";
import useResizeObserver from "@react-hook/resize-observer";
import moment from "moment";

import useEventFeed from "hooks/event-feed";
import { LiveVideoPlayer } from "element/live-video-player";
import { findTag } from "utils";
import { Profile, getName } from "element/profile";
import { LiveChat } from "element/live-chat";
import AsyncButton from "element/async-button";
import { Icon } from "element/icon";
import { useLogin } from "hooks/login";
import { StreamState, System } from "index";
import Modal from "element/modal";
import { SendZaps } from "element/send-zap";
import type { NostrLink } from "@snort/system";
import { useUserProfile } from "@snort/system-react";
import { NewStream } from "element/new-stream";

function ProfileInfo({ link }: { link: NostrLink }) {
  const thisEvent = useEventFeed(link, true);
  const login = useLogin();
  const navigate = useNavigate();
  const [zap, setZap] = useState(false);
  const [edit, setEdit] = useState(false);
  const profile = useUserProfile(System, thisEvent.data?.pubkey);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  const status = findTag(thisEvent.data, "status");
  const start = findTag(thisEvent.data, "starts");
  const isLive = status === "live";
  const isMine = link.author === login?.pubkey;

  async function deleteStream() {
    const pub = await EventPublisher.nip7();
    if (pub && thisEvent.data) {
      const ev = await pub.delete(thisEvent.data.id);
      console.debug(ev);
      System.BroadcastEvent(ev);
      navigate("/");
    }
  }

  return (
    <>
      <div className="flex info">
        <div className="f-grow stream-info">
          <h1>{findTag(thisEvent.data, "title")}</h1>
          <p>{findTag(thisEvent.data, "summary")}</p>
          <div className="tags">
            <span className={`pill${isLive ? " live" : ""}`}>{status}</span>
            {status === StreamState.Planned && (
              <span className="pill">
                Starts {moment(Number(start) * 1000).fromNow()}
              </span>
            )}
            {thisEvent.data?.tags
              .filter((a) => a[0] === "t")
              .map((a) => a[1])
              .map((a) => (
                <span className="pill" key={a}>
                  {a}
                </span>
              ))}
          </div>
          {isMine && (
            <div className="actions">
              <button
                type="button"
                className="btn"
                onClick={() => setEdit(true)}
              >
                Edit
              </button>
              <AsyncButton
                type="button"
                className="btn btn-red"
                onClick={deleteStream}
              >
                Delete
              </AsyncButton>
            </div>
          )}
        </div>
        <div className="profile-info flex g24">
          <Profile pubkey={thisEvent.data?.pubkey ?? ""} />
          <button onClick={() => setZap(true)} className="btn btn-primary zap">
            Zap
            <Icon name="zap" size={16} />
          </button>
        </div>
      </div>
      {zap && zapTarget && thisEvent.data && (
        <Modal onClose={() => setZap(false)}>
          <SendZaps
            lnurl={zapTarget}
            ev={thisEvent.data}
            targetName={getName(thisEvent.data.pubkey, profile)}
            onFinish={() => setZap(false)}
          />
        </Modal>
      )}
      {edit && thisEvent.data && (
        <Modal onClose={() => setEdit(false)}>
          <NewStream ev={thisEvent.data} onFinish={() => setEdit(false)} />
        </Modal>
      )}
    </>
  );
}

function VideoPlayer({ link }: { link: NostrLink }) {
  const thisEvent = useEventFeed(link);
  const [zap, setZap] = useState(false);
  const [edit, setEdit] = useState(false);
  const profile = useUserProfile(System, thisEvent.data?.pubkey);
  const zapTarget = profile?.lud16 ?? profile?.lud06;

  const stream = findTag(thisEvent.data, "streaming");
  const image = findTag(thisEvent.data, "image");

  return (
    <>
      {zap && zapTarget && thisEvent.data && (
        <Modal onClose={() => setZap(false)}>
          <SendZaps
            lnurl={zapTarget}
            ev={thisEvent.data}
            targetName={getName(thisEvent.data.pubkey, profile)}
            onFinish={() => setZap(false)}
          />
        </Modal>
      )}
      {edit && thisEvent.data && (
        <Modal onClose={() => setEdit(false)}>
          <NewStream ev={thisEvent.data} onFinish={() => setEdit(false)} />
        </Modal>
      )}
      <div className="video-content">
        <LiveVideoPlayer stream={stream} autoPlay={true} poster={image} />
      </div>
    </>
  );
}

export function StreamPage() {
  const ref = useRef(null);
  const params = useParams();
  const link = parseNostrLink(params.id!);
  const [height, setHeight] = useState<number | undefined>();

  function setChatHeight() {
    const contentHeight =
      document.querySelector(".live-page")?.clientHeight || 0;
    const videoContentHeight =
      document.querySelector(".video-content")?.clientHeight || 0;
    if (window.innerWidth <= 480) {
      setHeight(contentHeight - videoContentHeight);
    } else if (window.innerWidth <= 768) {
      setHeight(videoContentHeight);
    } else {
      setHeight(undefined);
    }
  }

  useLayoutEffect(setChatHeight, []);
  useResizeObserver(ref, () => setChatHeight());

  return (
    <>
      <div ref={ref}></div>
      <VideoPlayer link={link} />
      <ProfileInfo link={link} />
      <LiveChat link={link} height={height} />
    </>
  );
}
