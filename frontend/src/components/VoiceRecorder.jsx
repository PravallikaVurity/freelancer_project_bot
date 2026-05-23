import { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaPlay, FaPause, FaTrash, FaUpload, FaCheck } from "react-icons/fa";
import { uploadVoiceProposal } from "../services/bidApi";
import toast from "react-hot-toast";

const MAX_SECONDS = 120; // 2 minutes

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const VoiceRecorder = ({ proposalId, onUploaded }) => {
  const [state, setState] = useState("idle"); // idle | recording | recorded | uploading | done
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const blobRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) { stopRecording(); return MAX_SECONDS; }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    blobRef.current = null;
    setSeconds(0);
    setPlaying(false);
    setState("idle");
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const handleUpload = async () => {
    if (!blobRef.current || !proposalId) {
      toast.error("Submit the proposal first, then upload voice");
      return;
    }
    setState("uploading");
    try {
      const formData = new FormData();
      const ext = blobRef.current.type.includes("webm") ? "webm" : "mp4";
      formData.append("audio", blobRef.current, `voice-proposal.${ext}`);
      formData.append("duration", seconds);
      await uploadVoiceProposal(proposalId, formData);
      setState("done");
      toast.success("Voice proposal uploaded!");
      onUploaded?.();
    } catch {
      setState("recorded");
      toast.error("Failed to upload voice proposal");
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 glass-light rounded-xl border border-[#2ee6a6]/30 text-[#2ee6a6] text-sm w-fit">
        <FaCheck className="text-xs" /> Voice Proposal Uploaded ✓
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#e8e8f0]">Voice Proposal (optional, max 2 min)</label>

      {/* Idle — show record button */}
      {state === "idle" && (
        <button type="button" onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2.5 glass-light rounded-xl border border-white/10 hover:border-[#9b6dff]/50 hover:text-[#9b6dff] text-[#8b8ba3] text-sm transition w-fit">
          <FaMicrophone /> 🎤 Record Voice Proposal
        </button>
      )}

      {/* Recording */}
      {state === "recording" && (
        <div className="flex items-center gap-3 px-4 py-2.5 glass-light rounded-xl border border-[#ff6b6b]/30">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b] animate-pulse" />
          <span className="text-sm text-[#ff6b6b] font-mono">{fmt(seconds)} / {fmt(MAX_SECONDS)}</span>
          <button type="button" onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6b6b]/20 border border-[#ff6b6b]/40 rounded-lg text-[#ff6b6b] text-xs hover:bg-[#ff6b6b]/30 transition">
            <FaStop /> Stop
          </button>
        </div>
      )}

      {/* Recorded — play, delete, upload */}
      {state === "recorded" && audioUrl && (
        <div className="glass-light rounded-xl border border-white/10 p-3 space-y-2">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="sr-only" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={togglePlay}
              className="h-9 w-9 rounded-full bg-[#9b6dff]/20 border border-[#9b6dff]/40 flex items-center justify-center text-[#9b6dff] hover:bg-[#9b6dff]/30 transition">
              {playing ? <FaPause className="text-xs" /> : <FaPlay className="text-xs ml-0.5" />}
            </button>
            <div className="flex-1">
              <p className="text-xs text-[#e8e8f0] font-medium">Voice Proposal Recorded</p>
              <p className="text-xs text-[#8b8ba3]">Duration: {fmt(seconds)}</p>
            </div>
            <button type="button" onClick={deleteRecording}
              className="h-8 w-8 rounded-lg glass-light border border-white/10 flex items-center justify-center text-[#8b8ba3] hover:text-[#ff6b6b] hover:border-[#ff6b6b]/30 transition">
              <FaTrash className="text-xs" />
            </button>
          </div>
          {proposalId && (
            <button type="button" onClick={handleUpload}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 rounded-lg text-[#2ee6a6] text-xs hover:bg-[#2ee6a6]/25 transition w-fit">
              <FaUpload className="text-xs" /> Upload Voice Proposal
            </button>
          )}
          {!proposalId && (
            <p className="text-xs text-[#8b8ba3]">Submit the proposal first to upload voice.</p>
          )}
        </div>
      )}

      {state === "uploading" && (
        <div className="flex items-center gap-2 px-4 py-2.5 glass-light rounded-xl border border-white/10 text-[#8b8ba3] text-sm">
          <span className="h-3 w-3 rounded-full border-2 border-[#2ee6a6] border-t-transparent animate-spin" />
          Uploading voice proposal...
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
