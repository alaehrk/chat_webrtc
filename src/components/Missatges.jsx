import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import '../css/Missatges.css';

const Missatges = () => {
    const [message, setMessage] = useState('');
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [user, setUser] = useState('');
    const [connected, setConnected] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const socketRef = useRef();

    const handleSendMessage = () => {
        if (message.trim() !== '') {
            if (editingIndex !== null) {
                const updatedMessages = [...receivedMessages];
                updatedMessages[editingIndex] = `${user}: ${message}`;
                setReceivedMessages(updatedMessages);
                socketRef.current.emit('edit', { index: editingIndex, message: updatedMessages[editingIndex] });
                setEditingIndex(null);
            } else {
                const messageWithUser = `${user}: ${message}`;
                socketRef.current.emit('chat', messageWithUser);
            }
            setMessage('');
        }
    };

    const handleConnect = () => {
        if (user.trim() !== '') {
            setConnected(true);
        }
    };

    const handleDisconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        setConnected(false);
        setUser('');
        setReceivedMessages([]);
    };

    const handleEditMessage = (index) => {
        setMessage(receivedMessages[index].split(': ')[1]);
        setEditingIndex(index);
    };

    const handleDeleteMessage = (index) => {
        const updatedMessages = receivedMessages.filter((_, i) => i !== index);
        setReceivedMessages(updatedMessages);
        socketRef.current.emit('delete', index);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (connected) {
                handleSendMessage();
            } else {
                handleConnect();
            }
        }
    };

    useEffect(() => {
        socketRef.current = io('http://localhost:3001');

        socketRef.current.on('initial_messages', (messages) => {
            setReceivedMessages(messages);
        });

        socketRef.current.on('chat', (message) => {
            setReceivedMessages((prevMessages) => [...prevMessages, message]);
        });

        socketRef.current.on('edit', ({ index, message }) => {
            setReceivedMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[index] = message;
                return updatedMessages;
            });
        });

        socketRef.current.on('delete', (index) => {
            setReceivedMessages((prevMessages) => prevMessages.filter((_, i) => i !== index));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div id="chat-container">
            {!connected ? (
                <div id="login-container">
                    <input
                        type="text"
                        name="user"
                        placeholder="Ingrese su nombre"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button onClick={handleConnect}>Conectar</button>
                </div>
            ) : (
                <div id="chat-interface">
                    <div id="message-input">
                        <input
                            type="text"
                            name="message"
                            placeholder="Ingrese su mensaje"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button onClick={handleSendMessage}>{editingIndex !== null ? 'Editar' : 'Enviar'}</button>
                        <button onClick={handleDisconnect}>Desconectar</button>
                    </div>
                    <div id="messages-container">
                        {receivedMessages.map((msg, index) => {
                            const [messageUser, ...messageContent] = msg.split(': ');
                            const isUserMessage = messageUser === user;

                            return (
                                <div key={index} className="message">
                                    <p>{msg}</p>
                                    {isUserMessage && (
                                        <>
                                            <button onClick={() => handleEditMessage(index)}>Editar</button>
                                            <button onClick={() => handleDeleteMessage(index)}>Borrar</button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Missatges;
