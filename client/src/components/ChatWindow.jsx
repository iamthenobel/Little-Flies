import { useEffect, useRef, useState } from "react";
import { Box, Avatar, Typography, TextField, IconButton, Menu, MenuItem, Fab, Fade, Modal, Button, ButtonBase, useMediaQuery } from "@mui/material";
import { Send, MoreVertical, Camera, Smile, Paperclip, ArrowDownCircle, MessageSquare, Edit2, Trash2 } from "react-feather";
import { Done, DoneAll, ErrorOutline, Close, ArrowBack, ArrowBackIos } from "@mui/icons-material";
import moment from "moment";
import axios from "axios";
import chatBg from '../assets/cta-bg.jpg';
import chatBg2 from '../assets/bg2.png';
import CountdownTimer from "./CountdownTimer";

  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const ChatWindow = ({ selectedChat, setSelectedChat, setShowChat, user}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [currentDate, setCurrentDate] = useState(moment());
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [replyingMessage, setReplyingMessage] = useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const saveEdit = async (messageId) => {
    if (!editedText.trim()) return;
    console.log('Message editing to ' + editedText + " at " + selectedChat.id);
    const conversationId = selectedChat.id;
    try {
        const response = await axios.put(`${API_BASE_URL}/api/messages/edit`, {
            messageId,
            newText: editedText,
            conversationId,
        });

        if (response.data.success) {
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === messageId ? { ...msg, message: editedText } : msg
                )
            );
            setEditingMessageId(null);
        }
    } catch (error) {
        console.error('Failed to edit message', error);
    }
};

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat?.id) {
      fetchMessages();
    }
  }, [selectedChat]);

  const fetchMessages = async () => {
    if (!selectedChat.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/messages/${selectedChat.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
      markMessagesAsRead(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
    }
  };

  const markMessagesAsRead = async (messages) => {
    const unreadMessages = messages.filter((msg) => msg.receiver_id === user.id && msg.is_read === 0);
    if (unreadMessages.length === 0) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/messages/markAsRead`,
        { conversation_id: selectedChat.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchMessages, 500);
    return () => clearInterval(interval);
  }, [selectedChat]); 

  const handleSendMessage = async () => {
    if (!user?.id || !newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No token found");

      const response = await axios.post(
        `${API_BASE_URL}/messages/send`,
        {
          sender_id: user.id,
          receiver_id: selectedChat.user_id || selectedChat.id,
          message: newMessage,
          reply_to_message_id: replyingMessage ? replyingMessage.id : null,
          reply_to_message: replyingMessage ? replyingMessage.message : null,
          reply_to_sender_id: replyingMessage ? replyingMessage.sender_id : null,
          reply_to_message_name: replyingMessage ? replyingMessage.sender_name : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { id, conversation_id, reply_to_message_id } = response.data;
      
      setSelectedChat((prev) => ({
        ...prev,
        id: conversation_id,
      }));

      setMessages((prev) => [
        ...prev,
        {
          id,
          conversation_id,
          sender_id: user.id,
          receiver_id: selectedChat.user_id || selectedChat.id,
          message: newMessage,
          reply_to_message_id,
          timestamp: new Date().toISOString(),
          is_read: 0,
        },
      ]);

      setNewMessage(""); 
      setReplyingMessage(null);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleScroll = () => {
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      const isUserAtBottom =
      chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 1;
      setIsAtBottom(isUserAtBottom);
    }
  };
  
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);
  
  useEffect(() => {
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }
    return () => {
      chatContainer?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Header menu handlers
  const handleHeaderMenuOpen = (event) => {
    setHeaderMenuAnchor(event.currentTarget);
  };

  const handleHeaderMenuClose = () => {
    setHeaderMenuAnchor(null);
  };

  // Message menu handlers
  const handleMessageMenuOpen = (event, msgId) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessageId(msgId);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessageId(null);
  };

  const handleMessageAction = (action, msgId) => {
    console.log(`Action: ${action}, Message ID: ${msgId}`);
    handleMessageMenuClose();
  };
  const handleEditAction = (action, messageId, messageText) => {
    if (action === "Edit") {
        setEditingMessageId(messageId);
        setEditedText(messageText);
        handleMessageMenuClose();
    }
};

  const handleDeleteMessage = (msgId, type) => {
    setMessageToDelete(msgId);
    setDeleteType(type);
    setOpenDeleteModal(true);
  };

  const handleReplyAction = (type, messageId) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message) {
      setReplyingMessage(message);
      handleMessageMenuClose();
    }
  };  

const confirmDeleteMessage = async () => {
  console.log("Deleting Message ID:", messageToDelete, "Type:", deleteType); 
  if (!messageToDelete) return;
  handleMessageMenuClose();
  setOpenDeleteModal(false);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/delete-message`, {
      messageId: messageToDelete,
      userId: user.id,
      deleteType, // "me" or "everyone"
    });
    
    if (response.data.success) {
      console.log(`Message deleted (${deleteType}) at (${messageToDelete})`);
      
  setMessageToDelete(null);
  setDeleteType(null);
    }
  } catch (error) {
    console.error("Error deleting message:", error);
  }
  
};

const undoDeleteMessage = async (msgId, type) => {
  setMessageToDelete(msgId);
  setDeleteType(type);
  console.log("Undo Delete Message ID:", msgId, "Type:", type); 
  if (!messageToDelete) return;

  try {
    const response = await axios.post(`${API_BASE_URL}/api/undo-delete-message`, {
      messageId: messageToDelete,
      userId: user.id,
      deleteType,
    });

    if (response.data.success) {
      console.log(`Message restored (${deleteType})`);
      setMessageToDelete(false);
  setDeleteType(false);
    }
  } catch (error) {
    console.error("Error restoring message:", error);
  }
  
};

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(moment());
    }, 60000); 

    return () => clearInterval(interval);
  }, []);

  const groupMessagesByDate = (messages) => {
    const groupedMessages = {};

    messages.forEach((msg) => {
      const msgDate = moment(msg.timestamp);
      const today = currentDate.startOf("day");
      const yesterday = moment().subtract(1, "day").startOf("day");

      let header;
      if (msgDate.isSame(today, "day")) {
        header = "Today";
      } else if (msgDate.isSame(yesterday, "day")) {
        header = "Yesterday";
      } else if (msgDate.isAfter(moment().subtract(7, "days"), "day")) {
        header = msgDate.format("dddd");
      } else {
        header = msgDate.format("DD.MM.YYYY");
      }

      if (!groupedMessages[header]) {
        groupedMessages[header] = [];
      }
      groupedMessages[header].push(msg);
    });

    return groupedMessages;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Box 
    sx={{ flex: 1, 
      display: "flex",
      position: "relative",
      overflowY: "auto", 
      flexDirection: "column", 
      height: "100vh", 
      p: 0,
      pt:5,
      backgroundImage: `url(${chatBg2})`, 
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat" }}>
      {/* Chat Header */}
      <Box
        sx={{
          display: "flex",
          position:"fixed",
          top:0,
          width:"100%",
          zIndex:100,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
          p: 1,
          background:"#f2f2f2",
          backgroundImage: ``, // Use imported image
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
        {isMobile && (
  <IconButton onClick={() => setShowChat(false)}>
    <ArrowBackIos />
  </IconButton>
)}
          <Avatar src={selectedChat.profile_pic || "/default-avatar.png"} sx={{ mr: 2 }} />
          <Box>
            <Typography
              variant="h6"
              component="a"
              href={`/profile/${selectedChat.user_id}`}
              sx={{ textDecoration: "none", color: "#333", fontSize:"16px", fontWeight:"semi-bold" }}
            >
              {selectedChat.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" fontSize="12px">
              {selectedChat.is_online ? "Online" : `Last seen ${moment(selectedChat.last_seen).fromNow()}`}
            </Typography>
          </Box>
          <IconButton onClick={handleHeaderMenuOpen} sx={{ position:"absolute", right:2 }}>
          <MoreVertical />
        </IconButton>
        <Menu anchorEl={headerMenuAnchor} open={Boolean(headerMenuAnchor)} onClose={handleHeaderMenuClose}>
          <MenuItem onClick={() => handleMessageAction("View Profile")}>View Profile</MenuItem>
          <MenuItem onClick={() => handleMessageAction("Mute Chat")}>Mute Chat</MenuItem>
          <MenuItem onClick={() => handleMessageAction("Block User")}>Block User</MenuItem>
        </Menu>
        </Box>
        
      </Box>

      {/* Messages Container */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
      {Object.entries(groupedMessages).map(([dateHeader, messages]) => (
      <div key={dateHeader}>
        <Typography sx={{ textAlign: "center", my: 2, fontSize: "12px", background: "#ffe", borderRadius: "8px", color: "black", minWidth: "50px", maxWidth: "80px", mx: "auto", py: 0.5, px: 1, opacity: 0.4, position:"sticky", top:30, zIndex:99 }}>
          {dateHeader}
        </Typography>

        {messages
  .filter(msg => !(msg.receiver_id === user.id && msg.is_deleted_for_receiver))
  .map((msg) => {
    const isDeletedForEveryone = msg.is_deleted_for_everyone;
    const isDeletedForSender = msg.is_deleted_for_sender && msg.sender_id === user.id;
    
    return (
      <Box key={msg.id} sx={{ display: "flex", justifyContent: msg.sender_id === user.id ? "flex-end" : "flex-start", mb: 1 }}>
        <Box
          sx={{
            maxWidth: "70%",
            pt: 1,
            pb: 1.5,
            pr: isDeletedForEveryone ? 3 : 5,
            pl: 1,
            borderRadius: 3,
            bgcolor: isDeletedForEveryone || isDeletedForSender ? "#f0f0f0": msg.sender_id === user.id ? "#00000080" : "#00003320",
            color: isDeletedForEveryone || isDeletedForSender ? "#555" : msg.sender_id === user.id ? "white" : "#ffc",
            position: "relative",
            textAlign: "left"
          }}
        >
          {/* Message Content */}
          {isDeletedForEveryone ? (
            <Typography sx={{ fontSize: "13px", fontStyle: "italic", opacity: 0.6, display:"flex", alignItems:"center" }}>
              <ErrorOutline sx={{fontSize:"17px", mr:0.5 }}/> {msg.sender_id === user.id ? "Message was deleted for everyone." : `${msg.sender_name} deleted a message`} <br /> 
             <ButtonBase sx={{fontStyle: "italic", fontSize: "13px", pl:1,color:"#00dd", textDecoration:"underline", opacity:0.3}}onClick= {(e) =>{ e.stopPropagation(); undoDeleteMessage(msg.id, "everyone")}}> Double tap to undo</ButtonBase>
            </Typography>
          ) : isDeletedForSender ? (
            <Typography sx={{ fontSize: "13px", fontStyle: "italic", opacity: 0.6, display:"flex", alignItems:"center" }}>
              <ErrorOutline sx={{fontSize:"17px", mr:0.5 }}/> {msg.sender_id === user.id ? "Message was deleted for you." : `${msg.receiver_name} deleted a message`} <br /> 
             <ButtonBase sx={{fontStyle: "italic", fontSize: "13px", pl:1,color:"#00dd", textDecoration:"underline", opacity:0.3}}onClick= {(e) =>{ e.stopPropagation(); undoDeleteMessage(msg.id, "everyone")}}> Double tap to undo</ButtonBase>
            </Typography>
          ) : (
            <>
            {/* Check if message is a reply */}
{msg.reply_to_message_id && (
  <Box sx={{ p: 1, bgcolor: "#eee", borderLeft: "4px solid #0022dd90", mb: 1,  }}>
    <Typography sx={{ fontSize: "12px", fontWeight: "bold", color: "#0022dd90" }}>
      {msg.reply_to_sender_id === user.id ? "You" : selectedChat.name}
    </Typography>
    <Typography sx={{ fontSize: "12px", color: "#555" }}>
      {msg.reply_to_message}
    </Typography>
  </Box>
)}
            <Typography sx={{ fontSize: "14px", letterSpacing: "0.5px" }}>
                {msg.message}
            </Typography>
            <div 
        key={msg.id} 
        style={{
          padding: "3px",
          borderRadius: "8px",
          border: editingMessageId === msg.id ? "1px solid rgba(180, 170, 255, 0.2)" : "none",
          backgroundColor: editingMessageId === msg.id ? "rgba(98, 90, 131, 0.2)" : "transparent",
          boxShadow: editingMessageId === msg.id ? "inset 0 1px 2px rgba(0, 0, 0, 0.1)" : "none",
          transition: "all 0.2s ease-in-out",
      }}
      
    >
        {editingMessageId === msg.id ? (
            <>
                {/* Editable Input */}
                <input
                    type="text"
                    value={editedText || ""}
                    onChange={(e) => setEditedText(e.target.value)}
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginBottom: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      backgroundColor: "#f9f9f9",
                    }}
                    
                    onFocus={(e) => e.target.style.borderColor = "#007bff"}
                    onBlur={(e) => e.target.style.borderColor = "#ccc"}
                    
                />

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "8px", marginTop: "0px" }}>
    <button 
        onClick={() => saveEdit(msg.id)} 
        style={{
            padding: "5px 15px",
            borderRadius: "3px",
            border: "none",
            backgroundColor: "#337bff80",
            color: "#fff",
            cursor: "pointer",
            transition: "0.2s",
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
        onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
    >
        Edit
    </button>
    
    <button 
        onClick={() => setEditingMessageId(null)} 
        style={{
            padding: "5px 15px",
            borderRadius: "3px",
            border: "none",
            backgroundColor: "#3545",
            color: "#fff",
            cursor: "pointer",
            transition: "0.2s",
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = "#a71d2a"}
        onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
    >
        Cancel
    </button>
</div>

            </>
        ) : (
            <></>
        )}
    </div></>
          )}

          {/* Timestamp & Read Status */}
          <Box variant="caption" sx={{ position: 'absolute', right:5, display: "flex", opacity: 0.5, bottom:0, fontSize: "10px", alignItems:"center" }}>
          <Box sx={{ mr: 0.5, mb:0.2 }}>
              {moment(msg.timestamp).format("HH:mm")}
            </Box> 
            <Box>
              {msg.sender_id === user.id && msg.hasOwnProperty("is_read") && (
                <> {msg.is_read === 1 ? <DoneAll sx={{ fontSize: "15px" }} /> : <Done sx={{ fontSize: "15px" }} />} </>
              )}
            </Box>
          </Box>

          {/* Message Options Menu (Hide if deleted for sender) */}
          {!isDeletedForSender && (
            <div>
              <IconButton size="small" sx={{ position: "absolute", top: 5, right: 2, opacity: 0.3 }} onClick={(event) => handleMessageMenuOpen(event, msg.id)}>
                <MoreVertical size={16} />
              </IconButton>

              <Menu anchorEl={messageMenuAnchor} open={selectedMessageId === msg.id} onClose={handleMessageMenuClose}>
                <MenuItem onClick={() => handleReplyAction("Reply", msg.id, msg.sender_id)}>
                  <MessageSquare size={16} style={{ marginRight: 8 }} /> Reply
                </MenuItem>
                
                {msg.sender_id === user.id ?(
                <MenuItem onClick={() => handleEditAction("Edit", msg.id)}>
                  <Edit2 size={16} style={{ marginRight: 8 }} /> Edit
                </MenuItem>
                ):(
                  <p></p>
                )}
                {/* Delete Options */}
                {msg.sender_id === user.id ? (
                  <div>
                    <MenuItem onClick={(e) =>{ e.stopPropagation(); handleDeleteMessage(msg.id, "everyone")}}>
                      <Trash2 size={16} style={{ marginRight: 8, color: "red" }} /> Delete for Everyone
                    </MenuItem>
                    <MenuItem onClick={(e) =>{ e.stopPropagation(); handleDeleteMessage(msg.id, "me")}}>
                      <Trash2 size={16} style={{ marginRight: 8 }} /> Delete for Me
                    </MenuItem>
                  </div>
                ) : (
                  <MenuItem onClick={(e) =>{ e.stopPropagation(); handleDeleteMessage(msg.id, "me")}}>
                    <Trash2 size={16} style={{ marginRight: 8 }} /> Delete for Me
                  </MenuItem>
                )}

                <MenuItem onClick={() => handleMessageAction("React", msg.id)}>
                  <Smile size={16} style={{ marginRight: 8 }} /> React
                </MenuItem>
              </Menu>
            </div>
          )}
        </Box>
      </Box>
    );
  })}
      </div>
    ))}

    {/* Delete Confirmation Modal */}
    <Modal open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
      <Box sx={{ width: 300, p: 3, backgroundColor: "white", borderRadius: 2, mx: "auto", mt: "20vh", textAlign: "center" }}>
        <Typography variant="h6">Confirm Delete</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "gray" }}>
          {deleteType === "everyone"
            ? "This will delete the message for both users. Are you sure?"
            : "This will delete the message only for you. Are you sure?"}
        </Typography>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" color="error" onClick={confirmDeleteMessage}>
            Yes, Delete
          </Button>
          <Button variant="outlined" onClick={() => setOpenDeleteModal(false)}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>

        <div ref={messagesEndRef} />
         {/* Scroll to Bottom Button */}
      <Fade in={!isAtBottom}>
        <Fab
          size="small"
          onClick={scrollToBottom}
          sx={{
            position: "fixed",
            bottom: 100,
            right: 20,
            color:"#d0d",
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <ArrowDownCircle />
        </Fab>
      </Fade>
      </Box>

      {/* Message Input */}
      <Box sx={{ display: "flex", flexDirection: "column", p: 1, bgcolor: "#fff", borderTop: "1px solid #ddd" }}>
      {/* Reply Preview Box */}
{replyingMessage && (
  <Box sx={{ p: 1, bgcolor: "#f1f1f1", borderLeft: "4px solid #007bff", borderTop: "1px solid #ddd", mb: 1 }}>
    <Typography sx={{ fontSize: "12px", fontWeight: "bold", color: "#007bff" }}>
      {replyingMessage.sender_id === user.id ? "You" : replyingMessage.sender_name}
    </Typography>
    <Typography sx={{ fontSize: "12px", color: "#555" }}>
      {replyingMessage.message}
    </Typography>
    <IconButton size="small" onClick={() => setReplyingMessage(null)}>
      <Close fontSize="small" />
    </IconButton>
  </Box>
)}

      <Box sx={{ display: "flex", alignItems: "center", p: 0, bgcolor: "#fff" }}>
        <IconButton>
          <Paperclip />
        </IconButton>
        <IconButton>
          <Camera />
        </IconButton>
        <IconButton>
          <Smile />
        </IconButton>
        <TextField
          fullWidth
          placeholder="Type a message..."
          variant="outlined"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <IconButton onClick={handleSendMessage} color="primary">
          <Send />
        </IconButton>
      </Box>
      </Box>
    </Box>
  );
};

export default ChatWindow;
