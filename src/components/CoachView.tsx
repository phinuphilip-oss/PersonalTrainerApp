import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Loader2, RotateCcw, Send, X } from 'lucide-react';
import { CoachMessage, NutritionTargets, UserProfile } from '../types';
import { compressImageFile } from '../utils/api';

interface CoachViewProps {
  profile: UserProfile;
  targets: NutritionTargets;
  activeDayTitle: string;
  messages: CoachMessage[];
  isSending: boolean;
  error: string | null;
  draftPrompt?: string;
  onConsumeDraftPrompt: () => void;
  onSendMessage: (
    text: string,
    image?: { base64: string; mimeType: string; dataUrl: string }
  ) => Promise<void>;
  onClearChat: () => void;
}

const QUICK_PROMPTS = [
  'My shoulder hurts during overhead press — swap it for something safe',
  'Give me 4 form cues for Barbell Romanian Deadlift',
  'How should I structure my pre- and post-workout protein & carbs?',
  'I only have 35 minutes today — how should I condense today’s session?',
];

function renderFormattedText(content: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanText = isBullet ? trimmed.slice(2) : trimmed;

        // Bold inline **text** rendering
        const segments = cleanText.split(/(\*\*[^*]+\*\*)/g);
        const renderedSegments = segments.map((seg, sIdx) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return (
              <strong key={sIdx} className="font-semibold text-white">
                {seg.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={sIdx}>{seg}</React.Fragment>;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#B8FF2C] mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B8FF2C] shrink-0" />
              <span>{renderedSegments}</span>
            </div>
          );
        }
        return <p key={idx}>{renderedSegments}</p>;
      })}
    </div>
  );
}

export const CoachView: React.FC<CoachViewProps> = ({
  profile,
  targets,
  activeDayTitle,
  messages,
  isSending,
  error,
  draftPrompt,
  onConsumeDraftPrompt,
  onSendMessage,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
    dataUrl: string;
  } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (draftPrompt) {
      setInput(draftPrompt);
      onConsumeDraftPrompt();
    }
  }, [draftPrompt, onConsumeDraftPrompt]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    try {
      const compressed = await compressImageFile(file);
      setAttachedImage(compressed);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to attach image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isSending) return;
    const text = input.trim();
    const img = attachedImage || undefined;
    setInput('');
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await onSendMessage(text, img);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-148px)] lg:h-[calc(100vh-64px)] min-h-[520px] space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 shrink-0">
        <div>
          <p className="text-xs text-slate-400">
            Context synced: {profile.goal} · {profile.equipment} · {targets.targetCalories} kcal · {activeDayTitle}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-0.5">
            AI Coach & Form Advisor
          </h1>
        </div>
        <button
          type="button"
          onClick={onClearChat}
          className="h-10 px-3.5 rounded-lg border border-white/[0.10] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Thread
        </button>
      </header>

      {/* Chat Transcript Container */}
      <div className="flex-1 min-h-0 rounded-xl bg-[#11161D] border border-white/[0.08] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 px-1">
                  <span>{isUser ? profile.name : 'Coach Kinetix'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 ${
                    isUser
                      ? 'bg-[#B8FF2C]/14 border border-[#B8FF2C]/30 text-slate-100'
                      : 'bg-[#090C10] border border-white/[0.08] text-slate-200'
                  }`}
                >
                  {msg.imagePreview && (
                    <img
                      src={msg.imagePreview}
                      alt="Uploaded coaching attachment"
                      className="max-h-52 rounded-lg mb-2.5 object-cover border border-white/[0.08]"
                    />
                  )}
                  {renderFormattedText(msg.content)}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex flex-col items-start">
              <div className="text-[11px] text-slate-500 mb-1 px-1">Coach Kinetix</div>
              <div className="rounded-2xl bg-[#090C10] border border-white/[0.08] px-4 py-3 text-sm text-slate-300 inline-flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 text-[#B8FF2C] animate-spin" />
                Reviewing your profile & training history...
              </div>
            </div>
          )}

          {(error || localError) && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error || localError}</span>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Quick Action Suggestions */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-white/[0.06] bg-[#0D1117] flex items-center gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={isSending}
              onClick={() => onSendMessage(q)}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#11161D] hover:border-white/20 text-xs text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#090C10] space-y-2.5"
        >
          {attachedImage && (
            <div className="inline-flex items-center gap-2.5 rounded-lg bg-[#11161D] border border-white/[0.10] p-1.5 pr-2.5">
              <img
                src={attachedImage.dataUrl}
                alt="Attachment preview"
                className="h-10 w-10 rounded object-cover"
              />
              <span className="text-xs text-slate-300">Image attached</span>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                aria-label="Remove attachment"
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
              id="coach-image-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach meal or form photo"
              title="Attach meal photo for macro analysis"
              className="h-11 w-11 rounded-lg border border-white/[0.10] bg-[#11161D] text-slate-300 hover:text-white hover:border-white/25 inline-flex items-center justify-center shrink-0 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for form cues, mid-workout swaps, or attach a meal photo..."
              className="flex-1 h-11 rounded-lg bg-[#11161D] border border-white/[0.10] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none"
            />

            <button
              type="submit"
              disabled={isSending || (!input.trim() && !attachedImage)}
              className="h-11 px-4 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#c8ff57] transition-colors disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
