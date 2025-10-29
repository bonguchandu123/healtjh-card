import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  MessageCircle, Send, Search, User, Phone, Mail, 
  Clock, CheckCheck, Circle, Building
} from 'lucide-react';

const DChatPage = () => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    fetchAvailableUsers();
    fetchConversations();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
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

    const wsUrl = `ws://localhost:8000/ws/${user.id}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        const message = data.data;
        if (selectedUser && (message.sender_id === selectedUser.id || message.receiver_id === selectedUser.id)) {
          setMessages(prev => [...prev, message]);
        }
        fetchConversations();
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/available-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (err) {
      console.error('Fetch available users error:', err);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/chat/${userId}/messages?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);

      const response = await fetch('http://localhost:8000/api/v1/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: selectedUser.id,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (role) => {
    const colors = {
      patient: 'bg-blue-500',
      admin: 'bg-purple-500',
      doctor: 'bg-green-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  const ConversationItem = ({ conversation }) => (
    <button
      onClick={() => {
        const userInfo = availableUsers.find(u => u.id === conversation.user_id);
        if (userInfo) {
          setSelectedUser(userInfo);
        }
      }}
      className={`w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
        selectedUser?.id === conversation.user_id ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(conversation.user_role)}`}>
          {getUserInitials(conversation.user_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-800 truncate">{conversation.user_name}</p>
            {conversation.unread_count > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {conversation.unread_count}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(conversation.last_message_time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </button>
  );

  const UserListItem = ({ userInfo }) => (
    <button
      onClick={() => setSelectedUser(userInfo)}
      className={`w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
        selectedUser?.id === userInfo.id ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(userInfo.role)}`}>
          {getUserInitials(userInfo.name)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{userInfo.name}</p>
          <p className="text-sm text-gray-600 capitalize">{userInfo.role}</p>
          {userInfo.specialization && (
            <p className="text-xs text-gray-500">{userInfo.specialization}</p>
          )}
        </div>
      </div>
    </button>
  );

  const MessageBubble = ({ message }) => {
    const isOwn = message.sender_id === user?.id;
    
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {!isOwn && (
            <p className="text-xs text-gray-500 mb-1 ml-1">{message.sender_name}</p>
          )}
          <div className={`rounded-lg px-4 py-2 ${
            isOwn 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}>
            <p className="break-words">{message.message}</p>
            <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {isOwn && (
                message.read ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Circle className="w-2 h-2 fill-current" />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            <div>
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase">Recent Chats</p>
              </div>
              {conversations.map((conv, index) => (
                <ConversationItem key={index} conversation={conv} />
              ))}
            </div>
          ) : null}

          {filteredUsers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  {conversations.length > 0 ? 'All Contacts' : 'Start New Chat'}
                </p>
              </div>
              {filteredUsers.map((userInfo, index) => (
                <UserListItem key={index} userInfo={userInfo} />
              ))}
            </div>
          )}

          {conversations.length === 0 && filteredUsers.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No conversations yet</p>
                <p className="text-sm text-gray-500">Start chatting with your patients</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(selectedUser.role)}`}>
                    {getUserInitials(selectedUser.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedUser.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {selectedUser.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      <span>{selectedUser.email}</span>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div>
                  {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a patient or admin from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DChatPage;