// frontend/js/videochat.js

document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:4000');

    // Elementos del DOM
    const localVideo = document.getElementById('local-video');
    const remoteVideo = document.getElementById('remote-video');
    const hangUpButton = document.getElementById('hang-up');

    let localStream;
    let peerConnection;
    let roomName;

    // Servidores STUN gratuitos de Google para ayudar a encontrar la ruta de conexión
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
            { 'urls': 'stun:stun1.l.google.com:19302' }
        ]
    };

    // 1. Obtener el nombre de la sala desde la URL (ej: videochat.html?room=grupo123)
    const urlParams = new URLSearchParams(window.location.search);
    roomName = urlParams.get('room');
    if (!roomName) {
        alert('Error: No se especificó una sala.');
        window.location.href = 'chat.html';
        return;
    }

    // 2. Iniciar la lógica de la videollamada
    async function startCall() {
        try {
            // Pedir acceso a la cámara y micrófono
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;

            // Unirse a la sala de señalización
            socket.emit('join-video-room', roomName);

        } catch (error) {
            console.error("Error al acceder a la cámara/micrófono:", error);
            alert("No se pudo acceder a la cámara o el micrófono.");
        }
    }

    // 3. Crear y configurar la conexión WebRTC
    function createPeerConnection(socketId) {
        peerConnection = new RTCPeerConnection(iceServers);

        // Cuando el otro usuario envía su video, lo mostramos
        peerConnection.ontrack = ({ streams: [stream] }) => {
            remoteVideo.srcObject = stream;
        };

        // Enviar nuestra información de red (candidatos ICE) al otro usuario
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', { target: socketId, candidate: event.candidate });
            }
        };

        // Añadir nuestras pistas de audio/video a la conexión para enviarlas
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    // --- MANEJO DE EVENTOS DE SOCKET.IO ---

    // Otro usuario se unió, creamos la conexión y le enviamos una oferta
    socket.on('user-joined', async (socketId) => {
        console.log('Otro usuario se unió:', socketId);
        createPeerConnection(socketId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { target: socketId, caller: socket.id, sdp: offer });
    });

    // Recibimos una oferta, la procesamos y enviamos una respuesta
    socket.on('offer', async (payload) => {
        console.log('Oferta recibida:', payload.caller);
        createPeerConnection(payload.caller);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { target: payload.caller, caller: socket.id, sdp: answer });
    });

    // Recibimos una respuesta, la aceptamos
    socket.on('answer', async (payload) => {
        console.log('Respuesta recibida:', payload.caller);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    // Recibimos un candidato ICE del otro usuario
    socket.on('ice-candidate', async (candidate) => {
        if (peerConnection && candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });
    
    // --- CONTROLES ---
    hangUpButton.addEventListener('click', () => {
        // Lógica para colgar
        if (peerConnection) peerConnection.close();
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        window.close(); // Cierra la ventana/pestaña
    });

    // Iniciar el proceso
    startCall();
});