'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { fileToDataUrl } from '@/lib/image';

/**
 * Guided identity capture (Spec 18) — the premium, camera-first flow that feeds the
 * KYC provider. Three stages: NIC front, NIC back, then a liveness selfie with
 * on-screen challenge prompts (look straight → turn head → blink/smile). Each stage
 * shows a framed overlay so the document/face lands in the right place, mirrors the
 * selfie preview, and captures a still to a data URL.
 *
 * Real biometric liveness runs vendor-side; here we (a) capture a clean, framed
 * selfie and (b) walk the user through timed challenges, recording which ones they
 * completed so the vendor (or mock) has the evidence + challenge order to score.
 * Falls back to file upload when the camera is unavailable or denied.
 */

export interface KycCaptureResult {
  nicFront: string;
  nicBack: string;
  selfie: string;
  challenges: string[];
}

type Stage = 'intro' | 'nicFront' | 'nicBack' | 'selfie' | 'review';
const SELFIE_CHALLENGES = ['lookStraight', 'turnLeft', 'turnRight', 'blink'] as const;

export function KycCapture({ onComplete }: { onComplete: (r: KycCaptureResult) => void }) {
  const t = useTranslations('kyc');
  const [stage, setStage] = useState<Stage>('intro');
  const [shots, setShots] = useState<{ nicFront?: string; nicBack?: string; selfie?: string }>({});
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [camError, setCamError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const facing = stage === 'selfie' ? 'user' : 'environment';
  const cameraStage = stage === 'nicFront' || stage === 'nicBack' || stage === 'selfie';

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Open (and re-open on stage/facing change) the camera for capture stages.
  useEffect(() => {
    if (!cameraStage) { stopCamera(); return; }
    let cancelled = false;
    setCamError('');
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      } catch {
        if (!cancelled) setCamError(t('cameraUnavailable'));
      }
    })();
    return () => { cancelled = true; stopCamera(); };
  }, [cameraStage, facing, stopCamera, t]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Grab the current video frame → downscaled data URL (mirror the selfie so the
  // saved image matches what the user saw).
  function snap(): string | null {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const maxW = 1000;
    const scale = Math.min(1, maxW / v.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  function captureNic(side: 'nicFront' | 'nicBack') {
    const img = snap();
    if (!img) { setCamError(t('captureFailed')); return; }
    setShots((s) => ({ ...s, [side]: img }));
    setStage(side === 'nicFront' ? 'nicBack' : 'selfie');
  }

  // Selfie: advance through challenge prompts; capture a frame at each step (the last
  // frame is kept as the selfie). This gives the vendor an ordered liveness sequence.
  function nextChallenge() {
    const img = snap();
    if (!img) { setCamError(t('captureFailed')); return; }
    const key = SELFIE_CHALLENGES[challengeIdx];
    const nextDone = [...done, key];
    setDone(nextDone);
    setShots((s) => ({ ...s, selfie: img })); // keep the latest frame as the selfie
    if (challengeIdx + 1 >= SELFIE_CHALLENGES.length) {
      setStage('review');
    } else {
      setChallengeIdx((i) => i + 1);
    }
  }

  // Fallback for no-camera environments: pick a file per stage.
  async function pickFile(side: 'nicFront' | 'nicBack' | 'selfie', file?: File) {
    if (!file) return;
    try {
      const url = await fileToDataUrl(file, 1000);
      setShots((s) => ({ ...s, [side]: url }));
      if (side === 'nicFront') setStage('nicBack');
      else if (side === 'nicBack') setStage('selfie');
      else { setDone(['uploaded']); setStage('review'); }
    } catch { setCamError(t('captureFailed')); }
  }

  function finish() {
    if (!shots.nicFront || !shots.nicBack || !shots.selfie) return;
    stopCamera();
    onComplete({
      nicFront: shots.nicFront,
      nicBack: shots.nicBack,
      selfie: shots.selfie,
      challenges: done.length ? done : ['uploaded'],
    });
  }

  // ---- render ---------------------------------------------------------------
  if (stage === 'intro') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl2 bg-primary-container p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold tracking-tight">{t('introTitle')}</h2>
              <p className="text-sm text-white/70">{t('introSubtitle')}</p>
            </div>
          </div>
        </div>
        <ul className="space-y-2.5">
          {[
            { k: 'stepNicFront', n: 1 },
            { k: 'stepNicBack', n: 2 },
            { k: 'stepSelfie', n: 3 },
          ].map((it) => (
            <li key={it.k} className="flex items-center gap-3 rounded-xl2 border border-line p-3 dark:border-gray-800">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-brand-ink">{it.n}</span>
              <span className="text-sm font-semibold text-ink dark:text-gray-100">{t(it.k)}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate">{t('privacyNote')}</p>
        <Button variant="brand" className="w-full" onClick={() => setStage('nicFront')}>{t('start')}</Button>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-gray-50">{t('reviewTitle')}</h2>
        <div className="grid grid-cols-3 gap-2">
          {(['nicFront', 'nicBack', 'selfie'] as const).map((k) => (
            <figure key={k} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shots[k]} alt={t(k)} className="aspect-[3/4] w-full rounded-base border border-line object-cover dark:border-gray-800" />
              <figcaption className="text-center text-[11px] font-semibold text-slate">{t(k)}</figcaption>
            </figure>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => { setChallengeIdx(0); setDone([]); setStage('nicFront'); }}>{t('retake')}</Button>
          <Button variant="brand" className="flex-1" onClick={finish}>{t('submit')}</Button>
        </div>
      </div>
    );
  }

  // Capture stages (nicFront / nicBack / selfie)
  const isSelfie = stage === 'selfie';
  const title = isSelfie ? t('selfieTitle') : stage === 'nicFront' ? t('nicFrontTitle') : t('nicBackTitle');
  const hint = isSelfie ? t(`challenge_${SELFIE_CHALLENGES[challengeIdx]}`) : t('nicHint');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-extrabold tracking-tight text-ink dark:text-gray-50">{title}</h2>
        {isSelfie && (
          <span className="text-xs font-bold text-slate">{challengeIdx + 1}/{SELFIE_CHALLENGES.length}</span>
        )}
      </div>

      {camError ? (
        <div className="space-y-3 rounded-xl2 border border-line p-4 text-center dark:border-gray-800">
          <p className="text-sm text-slate">{camError}</p>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-base bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">
            {t('uploadInstead')}
            <input type="file" accept="image/*" capture={facing} className="hidden"
              onChange={(e) => pickFile(stage as 'nicFront' | 'nicBack' | 'selfie', e.target.files?.[0])} />
          </label>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl2 bg-ink" style={{ aspectRatio: isSelfie ? '3 / 4' : '4 / 3' }}>
            <video ref={videoRef} muted playsInline
              className={`h-full w-full object-cover ${isSelfie ? '-scale-x-100' : ''}`} />
            {/* Framing overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {isSelfie ? (
                <div className="h-[70%] w-[58%] rounded-[50%] border-[3px] border-white/80 shadow-[0_0_0_9999px_rgba(11,13,18,0.45)]" />
              ) : (
                <div className="h-[62%] w-[86%] rounded-xl2 border-[3px] border-white/80 shadow-[0_0_0_9999px_rgba(11,13,18,0.45)]" />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 text-center">
              <p className="text-sm font-semibold text-white">{hint}</p>
            </div>
          </div>

          <Button variant="brand" className="w-full"
            onClick={() => (isSelfie ? nextChallenge() : captureNic(stage as 'nicFront' | 'nicBack'))}>
            {isSelfie ? (challengeIdx + 1 >= SELFIE_CHALLENGES.length ? t('finishSelfie') : t('nextPrompt')) : t('capture')}
          </Button>
          <p className="text-center text-xs text-slate">{t('holdSteady')}</p>
        </>
      )}
    </div>
  );
}
