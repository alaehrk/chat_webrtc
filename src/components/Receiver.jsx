import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../css/Receiver.css';

const Receiver = () => {
    const [image, setImage] = useState('');
    const [connected, setConnected] = useState(true);
    const serverRef = useRef();

    useEffect(() => {
        serverRef.current = io('http://localhost:3001');

        serverRef.current.on('video', (data) => {
            setImage(data);
        });

        serverRef.current.on('disconnect', () => {
            setConnected(false);
        });

        return () => {
            if (serverRef.current) {
                serverRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div id="receiver-container">
            {connected ? (
                image ? (
                    <img src={image} alt="Received Video" id="received-image" />
                ) : (
                    <p>Waiting for video stream...</p>
                )
            ) : (
                <p>Not receiving images</p>
            )}
        </div>
    );
};

export default Receiver;
