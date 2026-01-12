/* src/features/ads/pages/RequestDetailPage.js */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const RequestDetailPage = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const getDetails = httpsCallable(functions, 'getRequestDetails');
        const result = await getDetails({ requestId });
        setRequest(result.data);
      } catch (err) {
        console.error("Error fetching details:", err);
        setError("Could not load request details.");
      } finally {
        setLoading(false);
      }
    };

    if (requestId) fetchDetails();
  }, [requestId]);

  const handleApply = async () => {
    const message = window.prompt("Write a short note to the poster:", "I can help with this! When do you need it?");
    if (!message) return;

    try {
      const applyFunc = httpsCallable(functions, 'applyToRequest');
      await applyFunc({ requestId: request.id, message });
      alert("Application Sent! The poster will see it on their Dashboard.");
    } catch (err) {
      console.error(err);
      alert("Failed to apply: " + err.message);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-white">Loading details...</div>;
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>;
  if (!request) return <div className="text-center py-20 text-muted">Request not found.</div>;

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      
      {/* HEADER */}
      <div className="mb-6">
        <Link to="/adsx" className="text-muted hover:text-white text-sm mb-4 inline-block">← Back to Board</Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        {request.serviceType}
                    </span>
                    <span className="text-muted text-sm">{new Date(request.createdAt?._seconds * 1000).toLocaleDateString()}</span>
                </div>
                <h1 className="lux-title text-4xl leading-tight">{request.title}</h1>
            </div>

            <div className="lux-card p-4 text-center min-w-[200px] border border-primary/30 bg-primary/5">
                <span className="block text-muted text-xs uppercase tracking-widest mb-1">Budget</span>
                <span className="block text-3xl font-bold text-white font-heading">
                    {request.budget > 0 ? `$${request.budget}` : 'Negotiable'}
                </span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Description */}
            <div className="lux-card p-8">
                <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Project Details</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {request.description}
                </p>
            </div>

            {/* Requirements */}
            {request.requirements && request.requirements.length > 0 && (
                <div className="lux-card p-8">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Requirements</h3>
                    <ul className="space-y-2">
                        {request.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-300">
                                <span className="text-primary mt-1">✓</span>
                                {req}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Attachments */}
            {request.creativeAssets && request.creativeAssets.length > 0 && (
                <div className="lux-card p-8">
                     <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Attachments</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {request.creativeAssets.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block group relative aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-primary transition-colors">
                                {/* Simple preview logic (shows icon if not image) */}
                                {url.includes('data:image') || url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                    <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted group-hover:text-white">
                                        <FontAwesomeIcon icon={ICONS.FILE_ALT} className="text-3xl mb-2" />
                                        <span className="text-xs">File {idx+1}</span>
                                    </div>
                                )}
                            </a>
                        ))}
                     </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: SIDEBAR ACTIONS */}
        <div className="space-y-6">
            <div className="lux-card p-6 sticky top-6">
                <h3 className="font-bold text-white mb-4">Interested?</h3>
                <button 
                    onClick={handleApply}
                    className="lux-btn-primary w-full py-3 mb-3 flex justify-center items-center gap-2"
                >
                    <FontAwesomeIcon icon={ICONS.CHECK_CIRCLE} /> Apply Now
                </button>
                <button className="lux-btn-secondary w-full py-3">
                    Message Poster
                </button>
                
                <div className="mt-6 pt-6 border-t border-white/10 text-sm text-muted">
                    <p className="mb-2"><span className="text-white font-bold">Timeline:</span> {request.timeline || 'Flexible'}</p>
                    <p><span className="text-white font-bold">Status:</span> <span className="uppercase">{request.status}</span></p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default RequestDetailPage;