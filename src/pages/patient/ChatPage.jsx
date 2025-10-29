import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageCircle, 
  Send, 
  User, 
  Search,
  Circle,
  UserCircle,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  Clock,
  CheckCheck,
  X
} from 'lucide-react';

const ChatPage = () => {
  const { token, user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const VITE_WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000';
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchAvailableUsers();
    fetchConversations();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  const connectWebSocket = () => {
    if (!user?.id) return;

    const websocket = new WebSocket(`${VITE_WEBSOCKET_URL}/ws/${user.id}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        const message = data.data;
        
        // If message is from selected user, add to messages
        if (selectedUser && message.sender_id === selectedUser.id) {
          setMessages(prev => [...prev, message]);
          markMessageAsRead(message.id);
        }
        
        // Update conversations
        fetchConversations();
      } else if (data.type === 'message_sent') {
        // Message we sent was confirmed
        const message = data.data;
        if (selectedUser && message.receiver_id === selectedUser.id) {
          setMessages(prev => [...prev, message]);
        }
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    setWs(websocket);
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/chat/available-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${VITE_API_BASE_URL}/api/v1/chat/${userId}/messages`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      await fetch(
        `${VITE_API_BASE_URL}/api/v1/chat/messages/${messageId}/read`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      receiver_id: selectedUser.id,
      message: newMessage.trim()
    };

    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Building2 size={20} className="text-blue-600" />;
    if (role === 'doctor') return <Stethoscope size={20} className="text-green-600" />;
    return <User size={20} className="text-purple-600" />;
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'admin') return 'bg-blue-100 text-blue-700';
    if (role === 'doctor') return 'bg-green-100 text-green-700';
    return 'bg-purple-100 text-purple-700';
  };

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUsersToShow = () => {
    // Merge available users with conversations
    const conversationUserIds = conversations.map(c => c.user_id);
    const usersWithConversations = availableUsers.filter(u => 
      conversationUserIds.includes(u.id)
    );
    const usersWithoutConversations = availableUsers.filter(u => 
      !conversationUserIds.includes(u.id)
    );

    // Add unread count to users with conversations
    const enrichedUsers = usersWithConversations.map(user => {
      const conversation = conversations.find(c => c.user_id === user.id);
      return {
        ...user,
        last_message: conversation?.last_message,
        last_message_time: conversation?.last_message_time,
        unread_count: conversation?.unread_count || 0
      };
    });

    return [...enrichedUsers, ...usersWithoutConversations].filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💬 Messages</h1>
          <p className="text-gray-600">Chat with your doctors and hospital staff</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar - Contacts */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {getUsersToShow().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageCircle className="text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No contacts available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Book an appointment to chat with doctors
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {getUsersToShow().map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedUser(contact)}
                      className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors ${
                        selectedUser?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        {contact.online && (
                          <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" fill="currentColor" />
                        )}
                      </div>
                      
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 truncate">{contact.name}</h3>
                          {contact.unread_count > 0 && (
                            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                              {contact.unread_count}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {getRoleIcon(contact.role)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(contact.role)}`}>
                            {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                          </span>
                        </div>

                        {contact.specialization && (
                          <p className="text-xs text-gray-500 mt-1">{contact.specialization}</p>
                        )}
                        
                        {contact.hospital_name && (
                          <p className="text-xs text-gray-500 mt-1">{contact.hospital_name}</p>
                        )}

                        {contact.last_message && (
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {contact.last_message}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">{selectedUser.name}</h2>
                        <div className="flex items-center space-x-2 text-sm text-white/80">
                          <span className="capitalize">{selectedUser.role}</span>
                          {selectedUser.specialization && (
                            <>
                              <span>•</span>
                              <span>{selectedUser.specialization}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {(selectedUser.email || selectedUser.phone) && (
                    <div className="mt-3 flex items-center space-x-4 text-sm text-white/80">
                      {selectedUser.email && (
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{selectedUser.email}</span>
                        </div>
                      )}
                      {selectedUser.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{selectedUser.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="text-gray-400 mb-4" size={64} />
                      <p className="text-xl text-gray-600">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isOwn = message.sender_id === user.id;
                        const showDate = index === 0 || 
                          new Date(messages[index - 1].created_at).toDateString() !== 
                          new Date(message.created_at).toDateString();

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                  {new Date(message.created_at).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            
                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                                <div
                                  className={`px-4 py-2 rounded-2xl ${
                                    isOwn
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                      : 'bg-white border border-gray-200 text-gray-800'
                                  }`}
                                >
                                  <p className="text-sm break-words">{message.message}</p>
                                </div>
                                <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                                  isOwn ? 'justify-end' : 'justify-start'
                                }`}>
                                  <Clock size={12} />
                                  <span>
                                    {new Date(message.created_at).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {isOwn && message.read && (
                                    <CheckCheck size={14} className="text-blue-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows="2"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send size={20} />
                      <span>Send</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift + Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle className="text-white" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Select a conversation
                </h2>
                <p className="text-gray-600 max-w-md">
                  Choose a doctor or hospital admin from the list to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;