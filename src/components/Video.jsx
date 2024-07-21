import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import '../css/Video.css';
import Receiver from './Receiver';

const Video = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const serverRef = useRef();
    const [screenshotCount, setScreenshotCount] = useState(0);
    const [videoQuality, setVideoQuality] = useState("480p");
    const [captureQuality, setCaptureQuality] = useState("high");
    const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });

    useEffect(() => {
        const socket = io('http://localhost:3001');
        serverRef.current = socket;

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            socket.disconnect();
        };
    }, [intervalId]);

    const getConstraints = (quality) => {
        switch (quality) {
            case "1080p":
                return { width: 1920, height: 1080 };
            case "720p":
                return { width: 1280, height: 720 };
            default:
                return { width: 640, height: 480 };
        }
    };

    const startBroadcasting = async () => {
        if (stream) return;

        const constraints = {
            video: getConstraints(videoQuality)
        };

        try {
            const userVideo = await navigator.mediaDevices.getUserMedia(constraints);
            videoRef.current.srcObject = userVideo;
            setVideoSize(constraints.video);

            const id = setInterval(() => {
                if (videoRef.current && canvasRef.current) {
                    const context = canvasRef.current.getContext('2d');
                    if (context) {
                        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        const data = canvasRef.current.toDataURL('image/jpeg', captureQuality === "high" ? 1.0 : captureQuality === "medium" ? 0.7 : 0.3);
                        serverRef.current.emit('video', data);
                    }
                }
            }, 40);

            setIntervalId(id);
            setStream(true);
        } catch (error) {
            console.error('Error al acceder a la cámara: ', error);
            alert('Calidad de video no soportada');
        }
    };

    const startScreenSharing = async () => {
        if (stream) return;

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            videoRef.current.srcObject = screenStream;
            setVideoSize({ width: screenStream.getVideoTracks()[0].getSettings().width, height: screenStream.getVideoTracks()[0].getSettings().height });

            const id = setInterval(() => {
                if (videoRef.current && canvasRef.current) {
                    const context = canvasRef.current.getContext('2d');
                    if (context) {
                        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        const data = canvasRef.current.toDataURL('image/jpeg', captureQuality === "high" ? 1.0 : captureQuality === "medium" ? 0.7 : 0.3);
                        serverRef.current.emit('video', data);
                    }
                }
            }, 40);

            setIntervalId(id);
            setStream(true);
        } catch (error) {
            console.error('Error al acceder a la pantalla: ', error);
            alert('No se puede compartir la pantalla');
        }
    };

    const stopBroadcasting = () => {
        if (!stream) return;

        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }

        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        setStream(false);
    };

    const restartBroadcasting = async () => {
        stopBroadcasting();
        await startBroadcasting();
    };

    const takeScreenshot = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg', captureQuality === "high" ? 1.0 : captureQuality === "medium" ? 0.7 : 0.3);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `screenshot_${screenshotCount}.jpg`;
            link.click();
            setScreenshotCount(prevCount => prevCount + 1);
        }
    };

    const handleVideoQualityChange = async (e) => {
        setVideoQuality(e.target.value);
        await restartBroadcasting();
    };

    const handleCaptureQualityChange = (e) => {
        setCaptureQuality(e.target.value);
    };

    return (
        <div id="video-container">
            <div id="video-controls">
                <button onClick={startBroadcasting} disabled={stream}>Iniciar Broadcast</button>
                <button onClick={startScreenSharing} disabled={stream}>Compartir Pantalla</button>
                <button onClick={stopBroadcasting} disabled={!stream}>Parar Broadcast</button>
                <button onClick={takeScreenshot} disabled={!stream}>Captura de Pantalla</button>
                <label htmlFor="videoQualitySelect">Calidad de Video:</label>
                <select id="videoQualitySelect" value={videoQuality} onChange={handleVideoQualityChange}>
                    <option value="1080p">1080p (1920x1080)</option>
                    <option value="720p">720p (1280x720)</option>
                    <option value="480p">480p (640x480)</option>
                </select>
                <label htmlFor="captureQualitySelect">Calidad de Captura:</label>
                <select id="captureQualitySelect" value={captureQuality} onChange={handleCaptureQualityChange}>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                </select>
            </div>
            <div id="video-content">
                <video ref={videoRef} autoPlay muted width={videoSize.width} height={videoSize.height}></video>
            </div>
            <div id="canvas-content">
                <Receiver />
                {stream && <canvas ref={canvasRef} style={{ display: 'none' }} width={videoSize.width} height={videoSize.height}></canvas>}
            </div>
        </div>
    );
};

export default Video;
