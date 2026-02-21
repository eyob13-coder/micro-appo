"use client";

import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const UploadButton = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const router = useRouter();

    const handleUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (file) {
                setIsProcessing(true);
                setUploadError(null);
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (res.ok && data.lessons) {
                        // Persist generated lessons so landing page can hydrate feed immediately.
                        if (typeof window !== "undefined") {
                            sessionStorage.setItem("swipr_uploaded_lessons", JSON.stringify(data.lessons));
                            sessionStorage.setItem("swipr_uploaded_source_id", data.sourceId ?? "");
                            sessionStorage.setItem("swipr_uploaded_next_chunk_index", String(data.nextChunkIndex ?? 1));
                            sessionStorage.setItem("swipr_uploaded_has_more", String(Boolean(data.hasMore)));
                        }
                        router.push('/?showFeed=true');
                    } else if (data.requireGoogleAuth) {
                        setUploadError('Please sign in with Google first.');
                        setTimeout(() => router.push('/auth?callbackURL=/dashboard'), 1500);
                    } else if (data.limitReached) {
                        setUploadError('Free limit reached (3 uploads). Upgrade to Pro!');
                    } else if (data.fileTooLarge) {
                        const max = data.maxFileSizeMb ? `${data.maxFileSizeMb}MB` : 'your plan limit';
                        setUploadError(`File size too large. Max limit is ${max}.`);
                    } else {
                        setUploadError(data.error || 'Failed to process PDF');
                    }
                } catch (err) {
                    setUploadError('Network error. Please try again.');
                } finally {
                    setIsProcessing(false);
                }
            }
        };
        input.click();
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleUpload}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Upload size={18} />
                        Upload New PDF
                    </>
                )}
            </button>
            {uploadError && (
                <p className="text-red-400 text-xs font-bold">{uploadError}</p>
            )}
        </div>
    );
}
