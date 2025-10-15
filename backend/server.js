// backend/server.js - VERSIÓN FINAL Y COMPLETA

// 1. IMPORTACIONES DE MÓDULOS
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 2. CONFIGURACIÓN INICIAL
const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'este-es-un-secreto-muy-largo-y-seguro-que-debes-cambiar';
const PORT = process.env.PORT || 4000;

// 3. CONFIGURACIÓN DE LA BASE DE DATOS
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mundial_2026',
    password: '12345',
    port: 5432,
});

pool.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Error al conectar con la base de datos:', err.stack);
    else console.log('✅ Conexión a la base de datos "mundial_2026" exitosa.');
});

// 4. MIDDLEWARE DE AUTENTICACIÓN
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// 5. ENDPOINTS DE LA API (RUTAS HTTP)
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const result = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username', [username, email, password_hash]);
        res.status(201).json({ message: '¡Cuenta creada con éxito!', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'El email o nombre de usuario ya está en uso.' });
        console.error('❌ Error en el registro:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'Credenciales inválidas.' });
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash || user.password_has);
        if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas.' });
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Inicio de sesión exitoso', token, user: {id: user.id, username: user.username} });
    } catch (err) {
        console.error('❌ Error en el inicio de sesión:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const result = await pool.query('SELECT id, username FROM users WHERE id != $1 ORDER BY username ASC', [currentUserId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener la lista de usuarios:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.get('/api/messages/:room', authenticateToken, async (req, res) => {
    try {
        const { room } = req.params;
        const query = `
            SELECT m.id, m.content as text, m.sent_at as time, u.id as "userId", u.username as user
            FROM messages m JOIN users u ON m.user_id = u.id
            WHERE m.group_id = $1 ORDER BY m.sent_at ASC;`;
        const result = await pool.query(query, [room]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener el historial de mensajes:', err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// 6. CONFIGURACIÓN DEL SERVIDOR Y SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
const userSocketMap = {};

// 7. LÓGICA DE SOCKET.IO (CHAT EN TIEMPO REAL)
io.on('connection', (socket) => {
    console.log(`🔌 Usuario conectado al chat: ${socket.id}`);
    let currentRoom = '';

    // --- Lógica de Chat y Grupos ---
    socket.on('registerUser', async (userId) => {
        userSocketMap[userId] = socket.id;
        console.log(`Usuario ${userId} registrado con socket ${socket.id}`);
        try {
            const result = await pool.query(`
                SELECT g.id, g.name, g.description FROM groups g
                JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1;`, [userId]);
            socket.emit('initialGroupList', result.rows);
        } catch (err) { console.error("Error al obtener grupos:", err); }
    });

    socket.on('joinRoom', (room) => {
        if (currentRoom) socket.leave(currentRoom);
        socket.join(room);
        currentRoom = room;
        console.log(`Usuario ${socket.id} se unió a la sala: ${room}`);
    });

    socket.on('sendMessage', async (data) => {
        try {
            const { text, userId, room } = data;
            await pool.query('INSERT INTO messages (content, user_id, group_id) VALUES ($1, $2, $3)', [text, userId, room]);
            io.to(room).emit('receiveMessage', data);
        } catch (err) { console.error('❌ Error al procesar mensaje:', err); }
    });

    socket.on('createGroup', async (groupData) => {
        const { name, members, creatorId } = groupData;
        try {
            const groupResult = await pool.query('INSERT INTO groups (name, creator_id, description) VALUES ($1, $2, $3) RETURNING *', [name, creatorId, `Grupo de ${members.length} miembros`]);
            const newGroup = groupResult.rows[0];
            for (const memberId of members) {
                await pool.query('INSERT INTO group_members (user_id, group_id) VALUES ($1, $2)', [memberId, newGroup.id]);
            }
            console.log(`✅ Grupo "${newGroup.name}" creado en la BD.`);
            const groupInfoForClient = { id: newGroup.id, name: newGroup.name, description: newGroup.description };
            members.forEach(memberId => {
                const memberSocketId = userSocketMap[memberId];
                if (memberSocketId) io.to(memberSocketId).emit('newGroupAdded', groupInfoForClient);
            });
        } catch (err) { console.error("Error al crear grupo en BD:", err); }
    });

    // --- Lógica de Videollamada (Señalización) ---
    socket.on('solicitud-de-llamada', (data) => {
        const { targetId, room, from } = data;
        const targetSocketId = userSocketMap[targetId];
        if (targetSocketId) {
            console.log(` reenviando llamada de ${from.username} a ${targetId}`);
            io.to(targetSocketId).emit('llamada-entrante', { from, room });
        }
    });

    socket.on('llamada-aceptada', (data) => {
        io.to(data.toSocketId).emit('llamada-fue-aceptada', { room: data.room });
    });

    socket.on('llamada-rechazada', (data) => {
        io.to(data.toSocketId).emit('llamada-fue-rechazada');
    });

    socket.on('join-video-room', (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit('user-joined', socket.id);
    });

    socket.on('offer', (payload) => io.to(payload.target).emit('offer', payload));
    socket.on('answer', (payload) => io.to(payload.target).emit('answer', payload));
    socket.on('ice-candidate', (incoming) => io.to(incoming.target).emit('ice-candidate', incoming.candidate));

    // --- Desconexión ---
    socket.on('disconnect', () => {
        for (const userId in userSocketMap) {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
                console.log(`🧹 Usuario ${userId} eliminado del mapa.`);
                break;
            }
        }
        console.log(`🔌 Usuario desconectado del chat: ${socket.id}`);
    });
});

// 8. INICIAR EL SERVIDOR
server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});