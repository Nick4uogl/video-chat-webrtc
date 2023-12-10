import { useState } from "react";
import { useParams } from "react-router-dom";
import useWebRTC, { LOCAL_VIDEO } from "../../hooks/useWebRTC";
import { Button } from "antd";
import { Link } from "react-router-dom";
import {
  EndCallIcon,
  VideoTurnedOffIcon,
  VideoIcon,
  MicrophoneIcon,
  MicrophoneTurnedOffIcon,
} from "../../assets/Svgs";
import "./room.scss";

// function layout(clientsNumber = 1) {
//   const pairs = Array.from({ length: clientsNumber }).reduce(
//     (acc, next, index, arr) => {
//       if (index % 2 === 0) {
//         acc.push(arr.slice(index, index + 2));
//       }

//       return acc;
//     },
//     []
//   );

//   const rowsNumber = pairs.length;
//   const height = `${100 / rowsNumber}%`;

//   return pairs
//     .map((row, index, arr) => {
//       if (index === arr.length - 1 && row.length === 1) {
//         return [
//           {
//             width: "100%",
//             height,
//           },
//         ];
//       }

//       return row.map(() => ({
//         width: "50%",
//         height,
//       }));
//     })
//     .flat();
// }

function layout(numClients) {
  const numColumns = Math.ceil(Math.sqrt(numClients));
  const numRows = Math.ceil(numClients / numColumns);
  const lastRowItems = numClients - (numRows - 1) * numColumns;

  return {
    display: "grid",
    gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
    gridAutoRows: "1fr",
    gap: "10px",
  };
}

export default function Room() {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const { id: roomID } = useParams();
  const { clients, provideMediaRef, toggleVideo, toggleAudio } =
    useWebRTC(roomID);
  const videoLayout = layout(clients.length);

  const toggleCamera = () => {
    setVideoEnabled(!videoEnabled);
    toggleVideo();
  };

  const toggleMic = () => {
    setAudioEnabled(!audioEnabled);
    toggleAudio();
  };

  return (
    <div className="room">
      <div className="room-clients" style={videoLayout}>
        {clients.map((clientID, index) => {
          return (
            <div className="room-video-wrapper" key={clientID} id={clientID}>
              <video
                ref={(instance) => {
                  provideMediaRef(clientID, instance);
                }}
                autoPlay
                playsInline
                muted={clientID === LOCAL_VIDEO}
              />
            </div>
          );
        })}
      </div>
      <div className="room-footer">
        <Button
          style={{
            position: "relative",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            backgroundColor: audioEnabled ? "#535353" : "#ff4d4f",
          }}
          type="primary"
          danger={!audioEnabled}
          onClick={toggleMic}
        >
          {audioEnabled ? (
            <div className="video-turned-icon">
              <MicrophoneIcon />
            </div>
          ) : (
            <div className="video-turned-off-icon">
              <MicrophoneTurnedOffIcon />
            </div>
          )}
        </Button>
        <Button
          style={{
            position: "relative",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            backgroundColor: videoEnabled ? "#535353" : "#ff4d4f",
          }}
          type="primary"
          danger={!videoEnabled}
          onClick={toggleCamera}
        >
          {videoEnabled ? (
            <div className="video-turned-icon">
              <VideoIcon />
            </div>
          ) : (
            <div className="video-turned-off-icon">
              <VideoTurnedOffIcon />
            </div>
          )}
        </Button>
        <Link to={"/"}>
          <Button
            type="primary"
            danger
            style={{
              position: "relative",
              borderRadius: "30px",
              width: "65px",
              height: "50px",
            }}
          >
            <div className="end-call-icon">
              <EndCallIcon />
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
}
