import React from 'react';
import { Bookmark as BookmarkIcon, X, Trash2, ArrowRight } from 'lucide-react';
import { Bookmark } from '../utils/audio-engine';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onSelectBookmark,
  onDeleteBookmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#141624] border border-white/10 rounded-2xl p-6 shadow-2xl text-white max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Saved Quotes & Bookmarks ({bookmarks.length})</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bookmarks dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <BookmarkIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
              <p>No bookmarks yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Click "Bookmark Quote" while playing or reading to save favorite lines.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-amber-400">
                    {bm.chapterTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(bm.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic line-clamp-3 font-serif-book">
                  "{bm.sentenceText}"
                </p>

                <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectBookmark(bm);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                  >
                    <span>Jump to Audio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
