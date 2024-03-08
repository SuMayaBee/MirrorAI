"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Base64 } from "js-base64";
import convert from "browser-image-converter";
import { useChat } from "ai/react";
import React from "react";
import Webcam from "react-webcam";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Camera,
  FlipHorizontal,
  PersonStanding,
  Trash,
  Video,
  Volume,
  Volume2,
  CircleUser,
  Podcast,
  MicOff,
  Mic,
  Mic2,
  FileVideo,
  FileVideo2,
  Clover,
} from "lucide-react";
import { toast } from "sonner";
import { Rings } from "react-loader-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { beep } from "@/utils/audio";
import fs from "fs";
import path from "path";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type Props = {};

interface Message {
  role: "user" | "ai";
  content: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

function ChatMessage({
  message: { role, content },
}: {
  message: Pick<Message, "role" | "content">;
}) {
  const isAiMessage = role === "ai";

  return (
    <div
      className={cn(
        "mb-3 flex items-center mt-4",
        isAiMessage ? "me-5 justify-start" : "ms-5 justify-end"
      )}
    >
      {isAiMessage && <Bot className="mr-2 shrink-0" />}
      <p
        className={cn(
          "whitespace-pre-line rounded-md border px-3 py-2",
          isAiMessage ? "bg-background" : "bg-primary text-primary-foreground"
        )}
      >
        {content}
      </p>

      {!isAiMessage && <CircleUser size={30} className="ml-2 shrink-0" />}
    </div>
  );
}

const HomePage = (prpps: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoButtonPressed, setVideoButtonPressed] = useState(false);
  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isRecording2, setIsRecording2] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volumn, setVolumn] = useState(0.8);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [response, setResponse] = useState(null);
  const [description, setDescription] = useState("");
  const [description2, setDescription2] = useState("");
  const intervalRef = useRef(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [disExplain, setDisExplain] = useState(false);
  const [intput, setIntput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const [isVideoDisabled, setVideoDisabled] = useState(false);
  const [isFileVideo2Disabled, setFileVideo2Disabled] = useState(false);
  const [isCameraDisabled, setCameraDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);


useEffect(() => {
  if (messagesEndRef.current && containerRef.current) {
    containerRef.current.scrollTop = messagesEndRef.current.offsetTop;
  }
}, [messages]);

  const handleVideoClick = () => {
    setVideoDisabled(isVideoDisabled);
    setFileVideo2Disabled(!isVideoDisabled);
    setCameraDisabled(!isVideoDisabled);
  };

  const handleFileVideo2Click = () => {
    setFileVideo2Disabled(isFileVideo2Disabled);
    setVideoDisabled(!isFileVideo2Disabled);
    setCameraDisabled(!isFileVideo2Disabled);
  };

  const handleCameraClick = () => {
    setCameraDisabled(isCameraDisabled);
    setVideoDisabled(!isCameraDisabled);
    setFileVideo2Disabled(!isCameraDisabled);
  };

  const containerStyle: React.CSSProperties = {
    maxHeight: 'calc(100vh - 100px)', 
    overflowY: 'auto',
  };

  const startRecording = () => {
    setIsVoiceRecording(true);
    
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    
    recognitionRef.current.onresult = (event: any) => {
      const { transcript } = event.results[event.results.length - 1][0];

      
      console.log(event.results);
      setTranscript(transcript);
    };

    
    recognitionRef.current.start();
  };

  
  useEffect(() => {
    return () => {
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const stopRecording = async () => {
    if (recognitionRef.current) {
      
      recognitionRef.current.stop();

      

      try {
      
        const response = await fetch(
          `http://localhost:8000/describe_image/${encodeURIComponent(
            transcript
          )}`
        );
        const data = await response.json();

        
        console.log(data);
        setDescription(data);

        const talkResponse = await fetch("http://localhost:8000/talk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: data }),
        });

        const audioBlob = await talkResponse.blob();

        let reader = new FileReader();
        reader.onload = () => {
          if (audioRef.current) {
            audioRef.current.src = reader.result as string;
            audioRef.current.play();
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (error) {
        
        console.error("Error:", error);
      }

      
      setTranscript("");
      setIsVoiceRecording(false);
    }
  };

  const describeImage = async () => {
    try {
      const response = await axios.get("http://localhost:8000/describe_image");
      if (response.data.error) {
        setDescription(response.data.error);
      } else {
        setDescription(response.data);
      }

      const talkResponse = await fetch("http://localhost:8000/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: response.data }),
      });

      const audioBlob = await talkResponse.blob();

      let reader = new FileReader();
      reader.onload = () => {
        if (audioRef.current) {
          audioRef.current.src = reader.result as string;
          audioRef.current.play();
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleRecording = () => {
    setIsVoiceRecording(!isVoiceRecording);
    if (!isVoiceRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (description) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "ai", content: description },
      ]);
    }
  }, [description]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: input },
    ]);

    
    const response = await fetch(
      `http://localhost:8000/describe_image/${encodeURIComponent(input)}`
    );
    const data = await response.json();
    console.log(data);

    
    if (data.error) {
      console.error(data.error);
      return;
    }

    
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "ai", content: data },
    ]);
    setInput("");
  };

  const displayText = (text: string) => {
    const words = text.split(" ");
    let i = 0;

    const intervalId = setInterval(() => {
      if (i >= words.length) {
        clearInterval(intervalId);
      } else {
        setDisplayedText(
          (prevText) => prevText + (words[i] ? " " + words[i] : "")
        );
        i++;
      }
    }, 400); 
  };

  useEffect(() => {
    setDisplayedText("");
    displayText(description);
  }, [description]);

  const userPromptScreenshot = async () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      setScreenshotData(screenshot); 

      if (screenshot && typeof window !== "undefined") {
        try {
          
          const imageSrc = screenshot.split(",")[1];
          const imageBytes = Base64.atob(imageSrc);

          
          const arrayBuffer = new Uint8Array(imageBytes.length);
          for (let i = 0; i < imageBytes.length; i++) {
            arrayBuffer[i] = imageBytes.charCodeAt(i);
          }
          const blob = new Blob([arrayBuffer]);

          
          const img = document.createElement("img");
          img.src = URL.createObjectURL(blob);

          
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

           
            const pngImage = canvas.toDataURL("image/png");

            
            await sendImage(pngImage);
          }

        
          const pngImage = canvas.toDataURL("image/png");

        
          await sendImage(pngImage);
        } catch (error) {
          console.error("Failed to send image:", error);
        }
      }
    }
  };

  const captureImage = async () => {
    try {
      const video = document.createElement("video");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      video.srcObject = mediaStream;
      video.play();

     
      await new Promise((resolve) => (video.onplaying = resolve));

    
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0);

      
        mediaStream.getTracks().forEach((track) => track.stop());

       
        const base64Image = canvas.toDataURL("image/jpeg");

        
        await sendImage(base64Image);

  
        await describeImage();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const userPromptRecord = () => {
    if (isRecording) {
    
      if (intervalRef.current !== 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = 0;
      }
      setIsRecording(false);
      setScreenshotData(null);
      setDescription("");
    } else {
      setDescription("");
    
      captureImage();
      intervalRef.current = window.setInterval(captureImage, 9000);
      setIsRecording(true);
      setDescription("");
    }
  };

  const captureImage2 = async () => {
    try {
      const video = document.createElement("video");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      video.srcObject = mediaStream;
      video.play();

    
      await new Promise((resolve) => (video.onplaying = resolve));

     
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0);

     
        mediaStream.getTracks().forEach((track) => track.stop());

     
        const base64Image = canvas.toDataURL("image/jpeg");

  
        await sendImage(base64Image);

      
      }
    } catch (error) {
      console.error(error);
    }
  };

  const userPromptRecord2 = () => {
    if (isRecording2) {
     
      if (intervalRef.current !== 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = 0;
      }
      setIsRecording2(false);
      setScreenshotData(null);
      setDescription("");
    } else {
      setDescription("");
    

      captureImage2();
      intervalRef.current = window.setInterval(captureImage2, 9000);
      setIsRecording2(true);
      setDescription("");
    }
  };

  useEffect(() => {

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

 
  const sendImage = async (base64Image: string) => {
    try {
      await axios.post("http://localhost:8000/sendImage", {
        image_base64: base64Image,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* left division for webcam and canvas */}
      <div className="relative">
        <div className="relative h-screen w-full  p-4">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-contain p-2 rounded-lg neon-blue"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          >
            {" "}
          </canvas>
        </div>
      </div>

   
      <div className="animated-line m-4"></div>

      {/* Right division */}
      <div className="flex flex-row flex-1 pr-4">
        <div className="border-gray-700 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md rounded-md p-4 bg-gray-800 text-gray-300">
          {/* top */}
          <div className="flex flex-col gap-2">
            <ModeToggle />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => {
                  return !prev;
                });
              }}
              className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
            >
              <FlipHorizontal />
            </Button>

            <Separator className="my-2" />
          </div>

          {/* middle */}

          <div className="flex flex-col gap-2">
            <Separator className="my-2" />

            {isRecording2 ? (
              <Button
                disabled
                variant="outline"
                size={"icon"}
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                <Video />
              </Button>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size={"icon"}
                onClick={() => {
                  userPromptRecord();
                  handleVideoClick();
                }}
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                {isRecording ? <Rings color="white" height={45} /> : <Video />}
              </Button>
            )}
            <Separator className="my-2 border-t-2" />

            {/*middle middle */}

            {isRecording ? (
              <Button
                variant={"outline"}
                size={"icon"}
                disabled
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                <FileVideo2 />
              </Button>
            ) : (
              <Button
                variant={isRecording2 ? "destructive" : "outline"}
                size={"icon"}
                onClick={() => {
                  handleFileVideo2Click();
                  userPromptRecord2();
                }}
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                {isRecording2 ? (
                  <Rings color="white" height={45} />
                ) : (
                  <FileVideo2 />
                )}
              </Button>
            )}

            {isRecording2 ? (
              <Button
                variant={isVoiceRecording ? "destructive" : "outline"}
                size={"icon"}
                onClick={handleToggleRecording}
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                {isVoiceRecording ? (
                  <Rings color="red" height={45} />
                ) : (
                  <Podcast />
                )}
              </Button>
            ) : (
              <Button
                disabled
                variant={"outline"}
                size={"icon"}
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                <MicOff />
              </Button>
            )}

            <Separator className="my-2 border-t-4" />

            {isRecording || isRecording2 ? (
              <Button
                variant={"outline"}
                size={"icon"}
                disabled
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                <Camera />
              </Button>
            ) : (
              <Button
                variant={"outline"}
                size={"icon"}
                onClick={() => {
                  handleCameraClick();
                  userPromptScreenshot();
                }}
                className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
              >
                <Camera />
              </Button>
            )}
          </div>

          {/* bottom */}

          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => window.location.reload()}
              className="text-gray-300 hover:bg-gray-700 transition duration-200 neon-blue"
            >
              🤖
            </Button>
          </div>
        </div>

        <div className="h-full flex-1 py-4 px-2 ">
          {!isRecording && !screenshotData && !isRecording2 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Image
                src="https://i.pinimg.com/originals/84/8c/34/848c342a56e7854dec45b9349c21dfe5.gif"
                alt="AI Chatbot"
                width={500}
                height={300}
                
              />
   <p className="coolText">Made by SuMayaBee.🌞</p>

   
              
            </div>
          )}

          {!isRecording && screenshotData && !isRecording2 && (
            <div className="flex flex-col h-screen justify-between">
              <div className="flex flex-col items-center justify-center">
                <Image
                  src={screenshotData}
                  alt="Screenshot"
                  width={500} 
                  height={300}
                  layout="responsive"
                  className="transition-all duration-500 ease-in-out transform hover:scale-105 shadow-2xl rounded-lg"
                />
              </div>
              <div className="overflow-auto" ref={containerRef} style={containerStyle}>
              
              {description ? (
    <div className="mt-3 px-3" ref={scrollRef}>
      {messages.map((message, index) => (
        <ChatMessage message={message} key={index} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  ) : (
    <div className="flex items-start justify-center mt-4">
      <Button
        variant="secondary"
        className="m-4"
        onClick={() => {
          describeImage();
          setChatBoxOpen(true);
        }}
      >
        <Bot size={20} className="mr-2" />
        Click Me
      </Button>
    </div>
  )}
  </div>

              {chatBoxOpen && (
                <div className="mb-3">
                  <form onSubmit={handleSubmit} className="m-3 flex gap-1">
                    <Button
                      title="Clear Chat"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      type="button"
                      onClick={() => setMessages([])}
                    >
                      <Trash />
                    </Button>
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      ref={inputRef}
                    />
                    <Button type="submit">Send</Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* For Video */}
          {description && isRecording && (
            <div>
              <Image
                src="https://assets-global.website-files.com/6488cc2b899091ddde57a95d/64a6b0e0740e455bda54f399_Waveform.gif"
                alt="Waveform"
                width={500}
                height={300}
              />
              <div className="p-4 bg-gray-800 text-green-300 rounded-lg shadow-lg text-lg font-mono">
                <div className="animate-pulse">
                  <audio ref={audioRef} />
                  {displayedText}
                </div>
              </div>
            </div>
          )}

          {/* For Voice and Video */}
          {description && isRecording2 && (
            <div>
              <Image
                src="https://assets-global.website-files.com/6488cc2b899091ddde57a95d/64a6b0e0740e455bda54f399_Waveform.gif"
                alt="Waveform"
                width={500}
                height={300}
              />
              <div className="p-4 bg-gray-800 text-green-300 rounded-lg shadow-lg text-lg font-mono">
                <div className="animate-pulse">
                  <audio ref={audioRef} />
                  {displayedText}
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
