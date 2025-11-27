import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { X } from './Icons';

// Initialize socket outside component to prevent multiple connections
const socket = io.connect(process.env.REACT_APP_API_URL); // Use your live URL here

const ChatWindow = ({ rideId, rideName, currentUser, onClose }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Join the specific ride room
    socket.emit("join_ride", rideId);

    // Listen for previous messages
    socket.on("load_messages", (messages) => {
      setMessageList(messages);
    });

    // Listen for new messages
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("load_messages");
    };
  }, [rideId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        rideId: rideId,
        sender: currentUser._id,
        senderName: currentUser.name,
        content: currentMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setCurrentMessage("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold">Chat: {rideName}</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        {/* Message Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {messageList.map((msg, index) => {
             const isMe = msg.sender === currentUser._id;
             return (
               <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                 <div className={`max-w-[80%] p-3 rounded-lg ${isMe ? "bg-blue-500 text-white rounded-br-none" : "bg-white border border-gray-200 rounded-bl-none"}`}>
                    {!isMe && <p className="text-xs font-bold mb-1 text-gray-500">{msg.senderName}</p>}
                    <p className="text-sm">{msg.content}</p>
                 </div>
                 <span className="text-[10px] text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
               </div>
             );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-white flex gap-2">
          <input
            type="text"
            value={currentMessage}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(event) => setCurrentMessage(event.target.value)}
            onKeyPress={(event) => event.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;