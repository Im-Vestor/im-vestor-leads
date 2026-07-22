"use client";

import {
	CameraIcon,
	CheckIcon,
	CircleIcon,
	Loader2Icon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
	ScissorsIcon,
	SquareIcon,
	VideoIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/hooks/use-translation";

type Stage = "choose" | "live" | "recording" | "paused" | "preview";

const TILE_CLASS =
	"flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border border-input border-dashed text-muted-foreground text-sm transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-50";

const MIN_TRIM_GAP = 0.5;
const MAX_RECORD_SECONDS = 30;

const trimSupported =
	typeof HTMLMediaElement !== "undefined" &&
	"captureStream" in HTMLMediaElement.prototype;

function pickMimeType() {
	return MediaRecorder.isTypeSupported("video/webm")
		? "video/webm"
		: "video/mp4";
}

function acquireStream(videoId?: string, audioId?: string) {
	return navigator.mediaDevices.getUserMedia({
		video: {
			...(videoId ? { deviceId: { exact: videoId } } : {}),
			aspectRatio: { ideal: 16 / 9 },
			width: { ideal: 1280 },
			height: { ideal: 720 },
		},
		audio: audioId ? { deviceId: { exact: audioId } } : true,
	});
}

function formatSeconds(s: number) {
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${String(sec).padStart(2, "0")}`;
}

// Chrome records webm without duration metadata; seeking far past the end forces
// the browser to compute it.
function loadDuration(url: string): Promise<number> {
	return new Promise((resolve) => {
		const v = document.createElement("video");
		v.preload = "metadata";
		v.src = url;
		v.onloadedmetadata = () => {
			if (Number.isFinite(v.duration)) {
				resolve(v.duration);
				return;
			}
			v.ontimeupdate = () => {
				v.ontimeupdate = null;
				resolve(Number.isFinite(v.duration) ? v.duration : 0);
				v.src = "";
			};
			v.currentTime = Number.MAX_SAFE_INTEGER;
		};
		v.onerror = () => resolve(0);
	});
}

// Re-encode [start, end] by playing the clip offscreen through captureStream.
// Audio goes through a WebAudio graph that is captured but never reaches the
// speakers, so trimming is silent for the user.
async function trimClip(
	url: string,
	start: number,
	end: number,
): Promise<Blob> {
	const source = document.createElement("video");
	source.src = url;
	await new Promise<void>((res, rej) => {
		source.onloadedmetadata = () => res();
		source.onerror = () => rej(new Error("load failed"));
	});

	const ctx = new AudioContext();
	const audioSource = ctx.createMediaElementSource(source);
	const dest = ctx.createMediaStreamDestination();
	audioSource.connect(dest);

	const captured = (
		source as HTMLVideoElement & { captureStream(): MediaStream }
	).captureStream();
	const mixed = new MediaStream([
		...captured.getVideoTracks(),
		...dest.stream.getAudioTracks(),
	]);

	const mimeType = pickMimeType();
	const rec = new MediaRecorder(mixed, { mimeType });
	const chunks: Blob[] = [];
	rec.ondataavailable = (e) => {
		if (e.data.size > 0) chunks.push(e.data);
	};
	const done = new Promise<Blob>((resolve, reject) => {
		rec.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
		rec.onerror = () => reject(new Error("record failed"));
	});

	source.currentTime = start;
	await new Promise<void>((res) => {
		source.onseeked = () => res();
	});
	rec.start();
	await source.play();
	await new Promise<void>((res) => {
		const tick = () => {
			if (source.currentTime >= end || source.ended) {
				source.removeEventListener("timeupdate", tick);
				source.removeEventListener("ended", tick);
				res();
			}
		};
		source.addEventListener("timeupdate", tick);
		source.addEventListener("ended", tick);
	});
	source.pause();
	rec.stop();
	const blob = await done;
	void ctx.close();
	source.src = "";
	return blob;
}

export function RecordVideoDialog({
	open,
	onOpenChange,
	onRecorded,
	onUploadClick,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onRecorded: (file: File) => void;
	onUploadClick: () => void;
}) {
	const t = useTranslation();
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const [stage, setStage] = useState<Stage>("choose");
	const [ready, setReady] = useState(false);
	const [blob, setBlob] = useState<Blob | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [duration, setDuration] = useState(0);
	const [trimStart, setTrimStart] = useState(0);
	const [trimEnd, setTrimEnd] = useState(0);
	const [trimBusy, setTrimBusy] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [videoDeviceId, setVideoDeviceId] = useState("");
	const [audioDeviceId, setAudioDeviceId] = useState("");

	// Count recorded seconds (paused time excluded) and auto-stop at the cap.
	useEffect(() => {
		if (stage !== "recording") return;
		const id = setInterval(() => setElapsed((e) => e + 1), 1000);
		return () => clearInterval(id);
	}, [stage]);

	useEffect(() => {
		const rec = recorderRef.current;
		if (elapsed >= MAX_RECORD_SECONDS && rec && rec.state !== "inactive") {
			rec.stop();
		}
	}, [elapsed]);

	// Camera is only requested after the user picks "record" in the chooser.
	const needCamera = open && stage !== "choose";

	useEffect(() => {
		if (!needCamera) return;
		let cancelled = false;
		acquireStream()
			.then(async (stream) => {
				if (cancelled) {
					for (const track of stream.getTracks()) track.stop();
					return;
				}
				streamRef.current = stream;
				if (videoRef.current) videoRef.current.srcObject = stream;
				setReady(true);
				// Labels are only exposed after permission is granted.
				const devices = await navigator.mediaDevices.enumerateDevices();
				if (cancelled) return;
				setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
				setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
				setVideoDeviceId(
					stream.getVideoTracks()[0]?.getSettings().deviceId ?? "",
				);
				setAudioDeviceId(
					stream.getAudioTracks()[0]?.getSettings().deviceId ?? "",
				);
			})
			.catch(() => {
				toast.error(t("projCameraError"));
				onOpenChange(false);
			});
		return () => {
			cancelled = true;
			const rec = recorderRef.current;
			if (rec && rec.state !== "inactive") {
				rec.ondataavailable = null;
				rec.onstop = null;
				rec.stop();
			}
			recorderRef.current = null;
			if (streamRef.current) {
				for (const track of streamRef.current.getTracks()) track.stop();
				streamRef.current = null;
			}
			setStage("choose");
			setReady(false);
			setBlob(null);
			setPreviewUrl(null);
			setDuration(0);
			setTrimStart(0);
			setTrimEnd(0);
			setTrimBusy(false);
			setElapsed(0);
			setVideoDevices([]);
			setAudioDevices([]);
			setVideoDeviceId("");
			setAudioDeviceId("");
		};
	}, [needCamera, onOpenChange, t]);

	// Imperative device switch — avoids effect-driven camera re-acquire loops.
	async function switchDevice(next: { video?: string; audio?: string }) {
		const videoId = next.video ?? videoDeviceId;
		const audioId = next.audio ?? audioDeviceId;
		if (next.video !== undefined) setVideoDeviceId(next.video);
		if (next.audio !== undefined) setAudioDeviceId(next.audio);
		setReady(false);
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) track.stop();
			streamRef.current = null;
		}
		try {
			const stream = await acquireStream(
				videoId || undefined,
				audioId || undefined,
			);
			streamRef.current = stream;
			if (videoRef.current) videoRef.current.srcObject = stream;
			setReady(true);
		} catch {
			toast.error(t("projCameraError"));
		}
	}

	// Revoke stale object URLs (also runs on unmount).
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	function showPreview(recorded: Blob) {
		const url = URL.createObjectURL(recorded);
		setBlob(recorded);
		setPreviewUrl(url);
		// srcObject wins over src — detach the live stream for playback.
		if (videoRef.current) videoRef.current.srcObject = null;
		setStage("preview");
		void loadDuration(url).then((d) => {
			setDuration(d);
			setTrimStart(0);
			setTrimEnd(d);
		});
	}

	function startRecording() {
		const stream = streamRef.current;
		if (!stream) return;
		const mimeType = pickMimeType();
		const rec = new MediaRecorder(stream, { mimeType });
		chunksRef.current = [];
		rec.ondataavailable = (e) => {
			if (e.data.size > 0) chunksRef.current.push(e.data);
		};
		rec.onstop = () => {
			showPreview(new Blob(chunksRef.current, { type: mimeType }));
		};
		recorderRef.current = rec;
		rec.start();
		setElapsed(0);
		setStage("recording");
	}

	function pauseRecording() {
		recorderRef.current?.pause();
		setStage("paused");
	}

	function resumeRecording() {
		recorderRef.current?.resume();
		setStage("recording");
	}

	function retake() {
		setBlob(null);
		setPreviewUrl(null);
		setDuration(0);
		setElapsed(0);
		if (videoRef.current && streamRef.current) {
			videoRef.current.srcObject = streamRef.current;
		}
		setStage("live");
	}

	async function applyTrim() {
		if (!previewUrl || trimBusy) return;
		setTrimBusy(true);
		try {
			const trimmed = await trimClip(previewUrl, trimStart, trimEnd);
			const d = trimEnd - trimStart;
			setBlob(trimmed);
			setPreviewUrl(URL.createObjectURL(trimmed));
			setDuration(d);
			setTrimStart(0);
			setTrimEnd(d);
		} catch {
			toast.error(t("projTrimFailed"));
		} finally {
			setTrimBusy(false);
		}
	}

	function useRecording() {
		if (!blob) return;
		const ext = blob.type.includes("mp4") ? "mp4" : "webm";
		onRecorded(new File([blob], `pitch.${ext}`, { type: blob.type }));
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{stage === "choose" ? t("projPitchVideo") : t("projRecordVideo")}
					</DialogTitle>
				</DialogHeader>
				{stage === "choose" ? (
					<div className="grid grid-cols-2 gap-3">
						<button
							type="button"
							className={TILE_CLASS}
							onClick={() => {
								onOpenChange(false);
								onUploadClick();
							}}
						>
							<VideoIcon className="size-5" />
							{t("projUploadPitchVideo")}
						</button>
						<button
							type="button"
							className={TILE_CLASS}
							onClick={() => setStage("live")}
						>
							<CameraIcon className="size-5" />
							{t("projRecordVideo")}
						</button>
					</div>
				) : (
					<video
						ref={videoRef}
						autoPlay={stage !== "preview"}
						muted={stage !== "preview"}
						playsInline
						controls={stage === "preview"}
						src={stage === "preview" ? (previewUrl ?? undefined) : undefined}
						className="aspect-video w-full rounded-md border bg-black object-cover"
					/>
				)}
				{stage === "live" && videoDevices.length > 0 && (
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<NativeSelect
							aria-label={t("projCamera")}
							className="w-full"
							value={videoDeviceId}
							onChange={(e) => void switchDevice({ video: e.target.value })}
						>
							{videoDevices.map((d, i) => (
								<NativeSelectOption key={d.deviceId} value={d.deviceId}>
									{d.label || `${t("projCamera")} ${i + 1}`}
								</NativeSelectOption>
							))}
						</NativeSelect>
						<NativeSelect
							aria-label={t("projMicrophone")}
							className="w-full"
							value={audioDeviceId}
							onChange={(e) => void switchDevice({ audio: e.target.value })}
						>
							{audioDevices.map((d, i) => (
								<NativeSelectOption key={d.deviceId} value={d.deviceId}>
									{d.label || `${t("projMicrophone")} ${i + 1}`}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</div>
				)}
				{stage === "preview" && trimSupported && duration > MIN_TRIM_GAP && (
					<div className="flex flex-col gap-2">
						<Label>
							{t("projTrim")}{" "}
							<span className="font-normal text-muted-foreground">
								({formatSeconds(trimStart)} – {formatSeconds(trimEnd)})
							</span>
						</Label>
						<Slider
							min={0}
							max={duration}
							step={0.1}
							minStepsBetweenValues={Math.round(MIN_TRIM_GAP / 0.1)}
							value={[trimStart, trimEnd]}
							disabled={trimBusy}
							onValueChange={(value) => {
								const [start, end] = value as number[];
								setTrimStart(start);
								setTrimEnd(end);
							}}
						/>
					</div>
				)}
				<DialogFooter>
					{stage === "live" && (
						<Button type="button" disabled={!ready} onClick={startRecording}>
							<CircleIcon className="fill-red-500 text-red-500" />
							{t("projStartRecording")}
						</Button>
					)}
					{(stage === "recording" || stage === "paused") && (
						<>
							<span className="mr-auto flex items-center gap-2 font-medium text-sm tabular-nums">
								{stage === "recording" && (
									<span className="size-2 animate-pulse rounded-full bg-red-500" />
								)}
								{formatSeconds(elapsed)} / {formatSeconds(MAX_RECORD_SECONDS)}
							</span>
							{stage === "recording" ? (
								<Button type="button" variant="ghost" onClick={pauseRecording}>
									<PauseIcon /> {t("projPause")}
								</Button>
							) : (
								<Button type="button" variant="ghost" onClick={resumeRecording}>
									<PlayIcon /> {t("projResume")}
								</Button>
							)}
							<Button
								type="button"
								variant="destructive"
								onClick={() => recorderRef.current?.stop()}
							>
								<SquareIcon /> {t("projStopRecording")}
							</Button>
						</>
					)}
					{stage === "preview" && (
						<>
							<Button
								type="button"
								variant="ghost"
								disabled={trimBusy}
								onClick={retake}
							>
								<RotateCcwIcon /> {t("projRetake")}
							</Button>
							{trimSupported && duration > MIN_TRIM_GAP && (
								<Button
									type="button"
									variant="outline"
									disabled={
										trimBusy || (trimStart === 0 && trimEnd >= duration - 0.05)
									}
									onClick={() => void applyTrim()}
								>
									{trimBusy ? (
										<Loader2Icon className="animate-spin" />
									) : (
										<ScissorsIcon />
									)}
									{t("projTrim")}
								</Button>
							)}
							<Button type="button" disabled={trimBusy} onClick={useRecording}>
								<CheckIcon /> {t("projUseVideo")}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
