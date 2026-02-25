/* src/pages/MessagesPage.js */
import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import { useAuth } from '../features/auth/context/AuthContext';
import { useLocation } from 'react-router-dom';


const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const location = useLocation();
  const [participantNames, setParticipantNames] = useState({});
  // Load conversations
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.id),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(convs);
      setLoading(false);
    }, (error) => {
      console.error("Failed to fetch conversations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const q = query(
      collection(db, "conversations", selectedConversation.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);

      // Mark messages as read
      if (msgs.length > 0) {
        const markMessagesAsRead = httpsCallable(functions, 'markMessagesAsRead');
        markMessagesAsRead({ conversationId: selectedConversation.id }).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const sendMessage = httpsCallable(functions, 'sendMessage');
      await sendMessage({
        conversationId: selectedConversation.id,
        text: newMessage.trim()
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };
  // Auto-open conversation if navigated from notification
  useEffect(() => {
    const targetId = location.state?.openConversationId;
    if (!targetId || !conversations.length) return;
    const conv = conversations.find(c => c.id === targetId);
    if (conv && selectedConversation?.id !== conv.id) {
      setSelectedConversation(conv);
    }
  }, [location.state?.openConversationId, conversations]);

  const formatTime = (date) => {
    try {
      if (!date) return '';
      const d = date?.toDate ? date.toDate()
              : date?._seconds ? new Date(date._seconds * 1000)
              : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const formatDate = (date) => {
    try {
      if (!date) return 'Recently';
      const d = date?.toDate ? date.toDate()
              : date?._seconds ? new Date(date._seconds * 1000)
              : new Date(date);
      if (isNaN(d.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch { return 'Recently'; }
  };

  const getOtherParticipant = (conv) => {
    const otherId = conv.participants?.find(p => p !== user?.id);
    return participantNames[otherId] || 'Student';
  };

  // Load participant display names from Firestore
  useEffect(() => {
    if (!conversations.length || !user?.id) return;
    const allOtherIds = [...new Set(
      conversations.flatMap(c => c.participants || []).filter(id => id !== user.id)
    )];
    allOtherIds.forEach(async (uid) => {
      if (participantNames[uid]) return;
      try {
        const { doc: fsDoc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(fsDoc(db, 'users', uid));
        const d = userDoc.exists() ? userDoc.data() : {};
        setParticipantNames(prev => ({
          ...prev,
          [uid]: d.fullName || d.displayName || d.name || d.email || 'Student'
        }));
      } catch {
        setParticipantNames(prev => ({ ...prev, [uid]: 'Student' }));
      }
    });
  }, [conversations, user]);

  const getUnreadCount = (conv) => {
    return 0;
  };

  if (loading) return (
    <div className="text-white p-10 text-center animate-pulse">Loading messages...</div>
  );

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      
      <div className="mb-8">
        <h1 className="lux-title text-4xl">Messages</h1>
        <p className="lux-subtitle">Chat with other students about items.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-250px)]">

        {/* LEFT: CONVERSATIONS LIST */}
        <div className="lux-card p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-lg">Conversations ({conversations.length})</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <p>No conversations yet.</p>
                <p className="text-sm mt-2">Contact sellers or claim items to start chatting!</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b border-white/10 hover:bg-white/5 transition-colors text-left ${
                    selectedConversation?.id === conv.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm line-clamp-1">{conv.itemTitle || 'Conversation'}</h4>
                    <span className="text-xs text-muted">{formatDate(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-primary/80 mb-1">{getOtherParticipant(conv)}</p>
                  <p className="text-xs text-muted line-clamp-2">{conv.lastMessage || 'No messages yet'}</p>
                  {getUnreadCount(conv) > 0 && (
                    <span className="inline-block mt-2 bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
                      {getUnreadCount(conv)} new
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: MESSAGES */}
        <div className="lux-card p-0 overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{selectedConversation.itemTitle}</h3>
                  <p className="text-xs text-primary">{getOtherParticipant(selectedConversation)}</p>
                  <p className="text-xs text-muted capitalize">{selectedConversation.itemType}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-10">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isMe
                            ? 'bg-primary text-black rounded-br-none'
                            : 'bg-white/10 text-white rounded-bl-none'
                        }`}>
                          {msg.type === 'claim' && (
                            <div className="text-xs font-bold mb-1 opacity-70">
                              📌 CLAIM REQUEST
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <span className={`text-xs mt-1 block ${isMe ? 'text-black/60' : 'text-white/60'}`}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="lux-btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  {sending ? '...' : <><FontAwesomeIcon icon={ICONS.PAPER_PLANE} /> Send</>}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              <div className="text-center">
                <FontAwesomeIcon icon={ICONS.COMMENT} size="3x" className="mb-4 opacity-20" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default MessagesPage;