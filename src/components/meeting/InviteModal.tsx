'use client';

import React, { useState } from 'react';
import { Copy, Check, Link, QrCode } from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function InviteModal() {
  const { isInviteOpen, setIsInviteOpen, roomId } = useMeeting();
  const [isCopied, setIsCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${roomId}`
    : `/?room=${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <Modal
      isOpen={isInviteOpen}
      onClose={() => setIsInviteOpen(false)}
      title="Uchrashuvga taklif qilish"
      maxWidth="md"
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-300">
          Ushbu havola yoki xona kodini hamkasblar va do&apos;stlaringizga yuboring:
        </p>

        {/* Room Code Box */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block font-medium">Xona Kodi</span>
            <span className="text-lg font-mono font-bold text-blue-400 tracking-wider">
              {roomId}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="rounded-xl"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{isCopied ? 'Nusxalandi!' : 'Nusxalash'}</span>
          </Button>
        </div>

        {/* Full URL Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-blue-400" />
            To&apos;liq Uchrashuv Havolasi
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 font-mono select-all focus:outline-none"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCopy}
              className="rounded-xl shrink-0"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* QR Code section */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="p-2.5 bg-white rounded-xl">
            <QrCode className="w-10 h-10 text-gray-900" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Mobil orqali tezkor kirish</h4>
            <p className="text-xs text-gray-400">
              Kamerangizni ushbu QR kodga yo&apos;naltirib to&apos;g&apos;ridan-to&apos;g&apos;ri kiring
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
