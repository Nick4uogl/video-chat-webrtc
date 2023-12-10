const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});
const { version, validate } = require("uuid");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "video-chat",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));

const ACTIONS = require("./src/socket/actions");
const PORT = 8000;

function getClientRooms() {
  const { rooms } = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(
    (roomID) => validate(roomID) && version(roomID) === 4
  );
}

async function shareRoomsInfo() {
  const rooms = getClientRooms();

  // Only try to insert rooms into the database if there are any
  if (rooms && rooms.length > 0) {
    try {
      const [rows, fields] = await pool.query(
        "INSERT INTO rooms (id) VALUES ?",
        [rooms.map((room) => [room])]
      );
      console.log("Inserted", rows.affectedRows, "rows");
    } catch (err) {
      console.error("MySQL error:", err);
    }
  }

  // Emit rooms to clients
  io.emit(ACTIONS.SHARE_ROOMS, { rooms });
}

io.on("connection", (socket) => {
  console.log("connected");
  shareRoomsInfo();

  socket.on(ACTIONS.JOIN, (config) => {
    const { room: roomID } = config;
    const { rooms: joinedRooms } = socket;

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

    clients.forEach((clientID) => {
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false,
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    socket.join(roomID);
    shareRoomsInfo();
  });

  socket.on(ACTIONS.TOGGLE_VIDEO, ({ room, videoEnabled }) => {
    // Relay the 'TOGGLE_VIDEO' event to all other clients in the room
    socket.to(room).emit(ACTIONS.TOGGLE_VIDEO, {
      peerID: socket.id,
      videoEnabled,
    });
  });

  function leaveRoom() {
    const { rooms } = socket;

    Array.from(rooms)
      // LEAVE ONLY CLIENT CREATED ROOM
      .filter((roomID) => validate(roomID) && version(roomID) === 4)
      .forEach((roomID) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients.forEach((clientID) => {
          io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: socket.id,
          });

          socket.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });
        });

        socket.leave(roomID);
      });

    shareRoomsInfo();
  }

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on("disconnecting", leaveRoom);

  socket.on(ACTIONS.RELAY_SDP, ({ peerID, sessionDescription }) => {
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.RELAY_ICE, ({ peerID, iceCandidate }) => {
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    });
  });
});

// Endpoint to create rooms
app.post("/rooms", async (req, res) => {
  const { id, name, username } = req.body;
  console.log("id", id, "name", name, "username", username);
  if (!id || !name || !username) {
    return res
      .status(400)
      .json({ error: "Room id, name, and username are required" });
  }

  try {
    const [user] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const [result] = await pool.query(
      "INSERT INTO rooms (id, name, user_id) VALUES (?, ?, ?)",
      [id, name, user[0].id]
    );
    console.log("Created room:", result);
    res.status(201).json({ id, name, username });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Could not create room" });
  }
});

// Endpoint to retrieve rooms
app.get("/rooms/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const [user] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const [rooms] = await pool.query("SELECT * FROM rooms WHERE user_id = ?", [
      user[0].id,
    ]);
    res.json(rooms);
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Could not retrieve rooms" });
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Check if a user with the same username already exists
  const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  if (users.length > 0) {
    return res.status(400).json({ error: "Username already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert the new user into the database
    const [result] = await pool.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    console.log("Created user:", result);
    res.status(201).json({ username });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Retrieve the user from the database
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    // Compare the given password with the hashed password in the database
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // The user is authenticated
    res.status(200).json({ username });
  } catch (err) {
    console.error("MySQL error:", err);
    res.status(500).json({ error: "Could not log in" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

server.listen(PORT, () => {
  console.log("Server Started!");
});
