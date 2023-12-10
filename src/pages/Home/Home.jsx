import { useState, useEffect } from "react";
import { v4 } from "uuid";
import { Link, useNavigate } from "react-router-dom";
import { List, Button, Card, Input, Row, Col, Modal } from "antd";
import { baseApiUrl } from "./../../constants";
import useStore from "../../store/store";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import "./home.scss";

export default function Home() {
  const navigate = useNavigate();
  const [rooms, updateRooms] = useState([]);
  const userName =
    useStore((state) => state.username) || localStorage.getItem("username");
  const [roomName, setRoomName] = useState("");

  console.log("userName", userName);

  console.log("rooms", rooms);

  useEffect(() => {
    // Fetch rooms from the server when the component mounts
    console.log("fetching rooms");
    fetch(`${baseApiUrl}/rooms/${userName}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(updateRooms)
      .catch(console.error);
  }, []);

  const createRoom = () => {
    // Generate a new room ID
    const id = v4();
    const name = "New Room"; // Replace this with the actual room name

    // Send a request to the server to create a new room
    fetch(`${baseApiUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, username: userName }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not create room");
        }
        return response.json();
      })
      .then((room) => {
        // Navigate to the new room
        navigate(`/room/${room.id}`);
      })
      .catch(console.error);
  };

  const logout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to logout?",
      okText: "Yes",
      cancelText: "No",
      onOk() {
        // Clear the username from the store and local storage
        useStore.setState({ username: null });
        localStorage.removeItem("username");

        // Navigate back to the login page
        navigate("/login");
      },
    });
  };

  return (
    <div className="home">
      <Row
        gutter={16}
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Col>
            <Input
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={createRoom}>
              Create Room
            </Button>
          </Col>
        </div>
        <Col>
          <Button type="primary" danger onClick={logout}>
            Logout
          </Button>
        </Col>
      </Row>
      <List
        grid={{ gutter: 16, column: 4 }}
        style={{ marginTop: 26 }}
        dataSource={rooms}
        renderItem={(room) => (
          <List.Item>
            <Link to={`/room/${room.id}`}>
              <Card title={room.name}>{room.id}</Card>
            </Link>
          </List.Item>
        )}
      />
    </div>
  );
}
