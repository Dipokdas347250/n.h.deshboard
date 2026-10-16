import { useEffect, useRef, useState } from "react";
import { IoClose, IoImageOutline, IoMic, IoMusicalNotes, IoStop } from "react-icons/io5";
import { useLanguage } from "../../i18n/useLanguage";
import { IMAGE_TYPES, baseType, useFileCheck, withPreview } from "./attachmentFiles";

const MAX_IMAGES = 3;
const MAX_RECORDING_SECONDS = 300;

/** A recording format this browser supports, preferring small Opus files. */
const recorderType = () => {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

/** Records a voice message from the microphone and hands it over as a File. */
function VoiceRecorder({ onRecorded, onError }) {
  const { t } = useLanguage();
  const [seconds, setSeconds] = useState(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  const stopTracks = () => recorderRef.current?.stream.getTracks().forEach((track) => track.stop());

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      stopTracks();
    },
    []
  );

  if (recorderType() === null || !navigator.mediaDevices?.getUserMedia) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = recorderType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = () => {
        clearInterval(timerRef.current);
        stopTracks();
        setSeconds(null);
        const type = baseType(recorder.mimeType || mimeType || "audio/webm");
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunks, { type });
        if (blob.size) onRecorded(new File([blob], `voice-message.${extension}`, { type }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((value) => {
          if (value + 1 >= MAX_RECORDING_SECONDS) recorder.stop();
          return value + 1;
        });
      }, 1000);
    } catch {
      onError(t("attach.micDenied"));
    }
  };

  return seconds === null ? (
    <button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25">
      <IoMic /> {t("attach.record")}
    </button>
  ) : (
    <button type="button" onClick={() => recorderRef.current?.stop()} className="inline-flex animate-pulse items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold">
      <IoStop /> {t("attach.stop", { seconds })}
    </button>
  );
}

/**
 * Pictures (up to three) and one voice message or audio file for a support
 * message. `value` has the shape of `EMPTY_ATTACHMENTS`.
 */
export function AttachmentPicker({ value, onChange, onError, idPrefix = "attach" }) {
  const { t } = useLanguage();
  const check = useFileCheck();

  const addImages = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    const problem = files.map((file) => check(file, "image")).find(Boolean);
    if (problem) return onError(problem);
    const room = MAX_IMAGES - value.images.length;
    onChange({ ...value, images: [...value.images, ...files.slice(0, room).map(withPreview)] });
  };

  const setAudio = (file) => {
    const problem = check(file, "audio");
    if (problem) return onError(problem);
    onChange({ ...value, audio: withPreview(file) });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {value.images.length < MAX_IMAGES && (
          <label htmlFor={`${idPrefix}-images`} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25">
            <IoImageOutline /> {t("attach.addImage")}
          </label>
        )}
        <input id={`${idPrefix}-images`} type="file" accept={IMAGE_TYPES.join(",")} multiple onChange={addImages} className="sr-only" />

        {!value.audio && (
          <>
            <VoiceRecorder onRecorded={setAudio} onError={onError} />
            <label htmlFor={`${idPrefix}-audio`} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25">
              <IoMusicalNotes /> {t("attach.chooseAudio")}
            </label>
            <input
              id={`${idPrefix}-audio`}
              type="file"
              accept="audio/*,.m4a,.webm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) setAudio(file);
              }}
              className="sr-only"
            />
          </>
        )}
      </div>

      {(value.images.length > 0 || value.audio) && (
        <div className="flex flex-wrap items-center gap-3">
          {value.images.map((entry) => (
            <div key={entry.url} className="relative">
              <img src={entry.url} alt="" className="h-20 w-20 rounded-lg bg-white/5 object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(entry.url);
                  onChange({ ...value, images: value.images.filter((other) => other !== entry) });
                }}
                aria-label={t("attach.remove")}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
              >
                <IoClose size={12} />
              </button>
            </div>
          ))}
          {value.audio && (
            <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2">
              <audio controls src={value.audio.url} className="h-9 max-w-[16rem]" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(value.audio.url);
                  onChange({ ...value, audio: null });
                }} aria-label={t("attach.remove")} className="rounded-full bg-red-500 p-1 text-white">
                <IoClose size={12} />
              </button>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-white/50">{t("attach.limits")}</p>
    </div>
  );
}

/** Pictures as thumbnails that open full size, and audio as a player. */
export function AttachmentList({ attachments = [] }) {
  const { t } = useLanguage();
  if (!attachments.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {attachments.map((attachment) =>
        attachment.kind === "image" ? (
          <a key={attachment._id} href={attachment.url} target="_blank" rel="noreferrer noopener" title={t("pay.openScreenshot")}>
            <img src={attachment.url} alt={attachment.originalName || t("support.attachment")} className="h-24 w-24 rounded-lg bg-white/5 object-cover" />
          </a>
        ) : (
          <audio key={attachment._id} controls preload="none" src={attachment.url} className="h-10 max-w-full" />
        )
      )}
    </div>
  );
}
