import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { Link } from "react-router-dom";
import "./login.scss";
import { baseApiUrl } from "../../constants";

const Login = () => {
  const [usernameError, setUsernameError] = useState(null);
  const setUsername = useStore((state) => state.setUsername);
  const navigate = useNavigate();
  const onFinish = (values) => {
    fetch(`${baseApiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setUsernameError(data.error);
          return;
        }
        setUsername(data.username);
        localStorage.setItem("username", data.username);
        console.log("Success:", data);
        navigate("/");
      })
      .catch((error) => {
        console.error("Error:", error);
        setUsernameError(error.error);
      });
  };

  return (
    <div className="login">
      <Form name="login" onFinish={onFinish} initialValues={{ remember: true }}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your Username!" }]}
          help={usernameError}
          validateStatus={usernameError ? "error" : ""}
        >
          <Input placeholder="Username" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Log In
            </Button>
          </Form.Item>
          <Form.Item>
            <Link to="/register">
              <span style={{ color: "#fff" }}>Register</span>
            </Link>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default Login;
