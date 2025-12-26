import React, { useState } from 'react';
import { Download, FileVideo, FileJson, FileText, X, CheckCircle, Package, FileSpreadsheet } from 'lucide-react';
import { RecordedSession } from '../types';
import { exportCOCO, exportYOLO, exportVideo, generateReport } from '../services/mlExportService';

interface ExportWizardProps {
  session: RecordedSession;
  onClose: () => void;
}

export const ExportWizard: React.FC<ExportWizardProps> = ({ session, onClose }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'VIDEO' | 'COCO' | 'YOLO' | 'REPORT') => {
    setDownloading(type);
    
    // Slight delay to allow UI to update
    setTimeout(async () => {
      try {
        if (type === 'VIDEO') {
          exportVideo(session);
        } else if (type === 'COCO') {
          await exportCOCO(session);
        } else if (type === 'YOLO') {
          await exportYOLO(session);
        } else if (type === 'REPORT') {
          await generateReport(session);
        }
      } catch (e) {
        console.error(e);
        alert("Export failed. See console for details.");
      }
      setDownloading(null);
    }, 100);
  };

  const frameCount = session.frames.length;
  const duration = ((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000).toFixed(1);
  const objectCount = session.params.assetGroups.reduce((acc, g) => acc + g.count, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-emerald-500" />
              Recording Complete
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Captured {frameCount} frames over {duration}s with {objectCount} physics objects.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* VIDEO CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileVideo size={32} />
                </div>
                <span className="text-xs font-mono text-slate-500 uppercase border border-slate-700 px-2 py-1 rounded">WEBM</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Raw Video Footage</h3>
              <p className="text-sm text-slate-400 mb-6 h-10">
                Download the screen recording of the simulation. Used as the source image data for training.
              </p>
              <button 
                onClick={() => handleDownload('VIDEO')}
                disabled={!session.videoBlob}
                className="w-full py-3 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {downloading === 'VIDEO' ? 'Saving...' : <><Download size={18} /> Download Video</>}
              </button>
            </div>

            {/* COCO CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-500/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-900/30 rounded-lg text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <FileJson size={32} />
                </div>
                <span className="text-xs font-mono text-slate-500 uppercase border border-slate-700 px-2 py-1 rounded">JSON</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">COCO Dataset</h3>
              <p className="text-sm text-slate-400 mb-6 h-10">
                Standard Object Detection format. Includes bounding boxes mapped to video frames.
              </p>
              <button 
                onClick={() => handleDownload('COCO')}
                className="w-full py-3 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {downloading === 'COCO' ? 'Generating...' : <><Download size={18} /> Download JSON</>}
              </button>
            </div>

            {/* YOLO CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Package size={32} />
                </div>
                <span className="text-xs font-mono text-slate-500 uppercase border border-slate-700 px-2 py-1 rounded">ZIP</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">YOLO Labels</h3>
              <p className="text-sm text-slate-400 mb-6 h-10">
                Individual .txt files for each frame normalized for YOLO training (class x y w h).
              </p>
              <button 
                 onClick={() => handleDownload('YOLO')}
                className="w-full py-3 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {downloading === 'YOLO' ? 'Zipping...' : <><Download size={18} /> Download ZIP</>}
              </button>
            </div>

            {/* REPORT CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-900/30 rounded-lg text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet size={32} />
                </div>
                <span className="text-xs font-mono text-slate-500 uppercase border border-slate-700 px-2 py-1 rounded">MD</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Audit Report</h3>
              <p className="text-sm text-slate-400 mb-6 h-10">
                Metadata report containing scene configuration, physics parameters, and asset manifest.
              </p>
              <button 
                 onClick={() => handleDownload('REPORT')}
                className="w-full py-3 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {downloading === 'REPORT' ? 'Writing...' : <><Download size={18} /> Download Report</>}
              </button>
            </div>

          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 text-slate-400 hover:text-white font-medium">Close Wizard</button>
        </div>
      </div>
    </div>
  );
};