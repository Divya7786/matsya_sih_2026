import { useState, useEffect } from 'react';
import { globalOfflineCache, ConnectionStatus as ConnStatus } from '../services/offlineCache';

export function ConnectionStatusBadge() {
  const [status, setStatus] = useState<ConnStatus>(globalOfflineCache.getStatus());

  useEffect(() => {
    return globalOfflineCache.onStatusChange(setStatus);
  }, []);

  if (status === 'ONLINE') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900/40 border border-green-700/50 rounded text-xs text-green-300">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE
      </div>
    );
  }

  if (status === 'SLOW') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-900/40 border border-yellow-700/50 rounded text-xs text-yellow-300">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        SLOW
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-900/40 border border-red-700/50 rounded text-xs text-red-300">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      OFFLINE
    </div>
  );
}

export function DataProvenanceBadge({ label, isSimulated }: { label: string; isSimulated: boolean }) {
  if (isSimulated) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-900/30 border border-amber-700/40 rounded text-[10px] text-amber-300 uppercase tracking-wide">
        DEMO: {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-900/30 border border-cyan-700/40 rounded text-[10px] text-cyan-300 uppercase tracking-wide">
      {label}
    </span>
  );
}
