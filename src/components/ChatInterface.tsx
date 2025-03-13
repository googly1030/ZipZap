import React, { useState, useRef,useCallback } from "react";
import {
  MessageSquare,
  Send,
  Mail,
  FileText,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  Code,
  Share2,
  Mic,
  X,
  Clipboard,
} from "lucide-react";
import styles from "./ChatInterface.module.css";
import { SpeechRecognitionService } from "../utils/speechRecognition";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Header from "./LandingHeader";
import AlertDialog from "./AlertDialog";
import { Alert, Snackbar } from "@mui/material";
import ImageProcessor from "./ImageProcessor";
import LoadingDots from "./LoadingDots";
import ScreenDataDisplay from "./ScreenShare/ScreenDataDisplay";
import VoiceAssistant from "./VoiceAssistant";
import CodeAssistModeSelector, {
  CodeAssistMode,
} from "./CodeAssistModeSelector/CodeAssistModeSelector";
import VoiceMode from './VoiceMode/VoiceMode';

interface ChatInterfaceProps {
  userInfo: {
    name: string;
    email: string;
    company: string;
    jobRole: string;
  };
}

import {
  generateEmail,
  generatePresentation,
  generateCodeAssistance,
} from "../api/client";

interface Message {
  type: "user" | "bot";
  content:
    | string
    | {
        response: string;
        suggestions?: string[];
        codeSnippets?: Array<{
          title: string;
          code: string;
          language: string;
          explanation?: string;
        }>;
        references?: string[];
      };
  id?: string;
}

const CodeBlock: React.FC<{
  code: string;
  language: string;
}> = ({ code, language }) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={copyToClipboard}
        className="absolute right-2 top-2 p-2 rounded-lg bg-[#ffffff0f] 
                   opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Clipboard className="h-4 w-4" />
      </button>
      <SyntaxHighlighter
        language={language.toLowerCase()}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          background: "#2A2B2D",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// First, add this new component above your ChatInterface component
const FormattedResponse: React.FC<{ content: string }> = ({ content }) => {
  // Extract overview from content by removing code blocks
  const getOverview = (text: string) => {
    // Remove code blocks (text between ``` marks)
    const withoutCode = text.replace(/```[\s\S]*?```/g, "");
    // Split into sections
    return withoutCode.includes("#")
      ? withoutCode.split("\n").reduce((acc, line) => {
          if (line.startsWith("#")) {
            acc.push({ type: "header", content: line.replace(/^#+ /, "") });
          } else if (line.startsWith("•")) {
            acc.push({ type: "bullet", content: line.substring(2) });
          } else if (line.trim()) {
            acc.push({ type: "text", content: line });
          }
          return acc;
        }, [] as Array<{ type: string; content: string }>)
      : [{ type: "text", content: withoutCode }];
  };

  const overviewSections = getOverview(content);

  return (
    <div className="prose prose-invert max-w-none">
      {overviewSections.map((section, index) => {
        switch (section.type) {
          case "header":
            return (
              <h3
                key={index}
                className="text-lg font-semibold text-white mb-3 mt-6 first:mt-0"
              >
                {section.content}
              </h3>
            );
          case "bullet":
            return (
              <div key={index} className="flex items-start space-x-2 mb-2">
                <span className="text-[#8AB4F8] mt-1">•</span>
                <p className="text-[#ffffffcc]">{section.content}</p>
              </div>
            );
          default:
            return (
              <p
                key={index}
                className="text-[#ffffffcc] mb-4 leading-relaxed whitespace-pre-wrap"
              >
                {section.content}
              </p>
            );
        }
      })}
    </div>
  );
};

const getWelcomeMessage = (featureId: string, userName: string) => {
  const greetings = ["Hey there", "Welcome", "Hi", "Hello", "Great to see you"];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const messages = {
    email: [
      `${greeting} ${userName}! Ready to craft some powerful emails together? I'll help you write professional and impactful messages that get results. 💌`,
      `${greeting}! I'm your email writing companion, ${userName}. Let's create emails that stand out and make an impression. ✨`,
      `Welcome aboard ${userName}! Together we'll transform your ideas into compelling emails that get your message across perfectly. 📧`,
    ],
    presentation: [
      `${greeting} ${userName}! Let's create a presentation that will captivate your audience. First, tell me who we're presenting to! 🎯`,
      `Ready to make an impact, ${userName}? Let's design a presentation that will wow your audience. Just select your target audience to begin! 🎨`,
      `${greeting}! Together we'll craft a powerful presentation that tells your story, ${userName}. Choose your audience and let's begin! ✨`,
    ],
    codeAssist: null, // Set to null to prevent welcome message
  };

  // For code assist, return empty string to prevent message
  if (featureId === "codeAssist") {
    return "";
  }

  const featureMessages =
    messages[featureId as keyof typeof messages] || messages.codeAssist;
  return featureMessages
    ? featureMessages[Math.floor(Math.random() * featureMessages.length)]
    : "";
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userInfo }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: `Hello ${userInfo.name}, I'm here to help you create professional presentations and emails also assit with codin tailored to your needs.`,
      id: "initial-message",
    },
  ]);
  const [selectedFeature, setSelectedFeature] = useState<string | null>("codeAssist");
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechService] = useState(() => new SpeechRecognitionService());
  const [showAlert, setShowAlert] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(false);
  const [currentVoiceMessage, setCurrentVoiceMessage] = useState("");
  const [codeAssistMode, setCodeAssistMode] = useState<CodeAssistMode>("chat");
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [voiceConfig] = useState({
    rate: 1,
    pitch: 1,
    voice: 0,
  });
  const [hasStartedChat, setHasStartedChat] = useState(false);
  interface ScreenAnalysis {
    window: string;
    contentType: string;
    resolution: string;
    frameRate: string;
    languages: string[];
    codeComplexity: "Low" | "Medium" | "High";
    potentialIssues: number;
    performanceScore: number;
    bestPractices: { score: number; issues: number };
  }

  const [screenAnalysis, setScreenAnalysis] = useState<ScreenAnalysis | null>(
    null
  );

  const handleAnalysisComplete = (analysis: ScreenAnalysis) => {
    setScreenAnalysis(analysis);
  };

  const handleVoiceResponse = (message: Message) => {
    if (voiceAssistantActive && message.type === "bot") {
      let textToSpeak = "";

      if (typeof message.content === "string") {
        textToSpeak = message.content;
      } else {
        textToSpeak = message.content.response;

        if (message.content.codeSnippets?.length) {
          textToSpeak +=
            " I've also provided some code snippets that might help.";
        }

        if (message.content.suggestions?.length) {
          textToSpeak +=
            " Here are some best practices to consider: " +
            message.content.suggestions.join(". ");
        }
      }

      setCurrentVoiceMessage(textToSpeak);
    }
  };

  const features = [
    { id: "codeAssist", icon: Code, label: "Code Assistant" },
    { id: "email", icon: Mail, label: "Generate Email" },
    { id: "presentation", icon: FileText, label: "Create Presentation" },
  ];

  const audiences = [
    { id: "students", icon: GraduationCap, label: "Students" },
    { id: "clients", icon: Users, label: "Clients" },
    { id: "companies", icon: Building2, label: "Companies" },
    { id: "investors", icon: Briefcase, label: "Investors" },
  ];

  // Update the handleFeatureSelect function
  const handleFeatureSelect = (featureId: string) => {
    // Check if screen sharing is active and switching away from codeAssist
    if (
      isScreenSharing &&
      selectedFeature === "codeAssist" &&
      featureId !== "codeAssist"
    ) {
      setPendingFeature(featureId);
      setShowAlert(true);
    } else {
      switchFeature(featureId);
    }
  };

  // Add this new function to handle feature switching
  const switchFeature = (featureId: string) => {
    setSelectedFeature(featureId);
    setSelectedAudience(null);
    setHasStartedChat(false); 
    setIsVoiceModeActive(false);
    if (featureId !== "codeAssist") {
      setMessages([
        {
          type: "bot",
          content: getWelcomeMessage(featureId, userInfo.name),
          id: `welcome-${Date.now()}`,
        },
      ]);
    } else {
      setMessages([]);
    }

    setSelectedMessage(null);
    setIsModifying(false);
    setInputValue("");
  };

  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId);
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Clear textarea height and value
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "44px"; // Reset to min-height
      textarea.style.overflowY = "hidden";
    }

    // Reset input value
    setInputValue("");

    // Set hasStartedChat to true when user sends first message
    setHasStartedChat(true);

    try {
      const timestamp = Date.now();
      const userMessage = {
        type: "user" as const,
        content: inputValue,
        id: `user-${timestamp}`,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add loading message
      const loadingId = `loading-${timestamp}`;
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "loading",
          id: loadingId,
        },
      ]);

      if (!selectedFeature) {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              "Please select a feature (Email or Presentation) from the sidebar first.",
            id: `bot-${timestamp + 1}`,
          },
        ]);
        setInputValue("");
        return;
      }

      if (selectedFeature === "email") {
        try {
          const emailMetadata = {
            sender: {
              name: userInfo.name,
              role: userInfo.jobRole,
              company: userInfo.company,
              email: userInfo.email,
            },
          };

          const result = await generateEmail(
            inputValue,
            "professional",
            emailMetadata
          );

          if (result) {
            const formattedEmail = `From: ${userInfo.name}
            Role: ${userInfo.jobRole}
            Company: ${userInfo.company}
            Email: ${userInfo.email}

            Subject: ${result.subject}

            ${result.content}`;

            setMessages((prev) => [
              ...prev,
              {
                type: "bot",
                content: formattedEmail,
                id: `email-${Date.now()}`,
              },
            ]);
          }
        } catch (error) {
          console.error("API Error:", error);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Sorry, there was an error generating your content.",
              id: `error-${Date.now()}`,
            },
          ]);
        }
      } else if (selectedFeature === "presentation") {
        if (!selectedAudience) {
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Please select a target audience for your presentation.",
              id: Date.now().toString(),
            },
          ]);
          setInputValue("");
          return;
        }

        try {
          const result = await generatePresentation(
            inputValue,
            selectedAudience,
            "presentation"
          );

          if (result) {
            const formattedPresentation = `Title: ${
              result.title
            }\n\n${result.slides
              .map(
                (slide, index) =>
                  `Slide ${index + 1}: ${slide.title}\n${slide.content}`
              )
              .join("\n\n")}`;

            setMessages((prev) => [
              ...prev,
              {
                type: "bot",
                content: formattedPresentation,
                id: `presentation-${Date.now()}`,
              },
            ]);
          }
        } catch (error) {
          console.error("API Error:", error);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content:
                "Sorry, there was an error generating your presentation.",
              id: `error-${Date.now()}`,
            },
          ]);
        }
      } else if (selectedFeature === "codeAssist") {
        try {
          const result = await generateCodeAssistance(
            inputValue,
            isScreenSharing,
            mediaStream
          );

          // Parse the response if it's a string
          let parsedContent;
          if (typeof result === "string") {
            try {
              parsedContent = JSON.parse(result);
            } catch (parseError) {
              console.error("Error parsing response:", parseError);
              parsedContent = { response: result };
            }
          } else {
            parsedContent = result;
          }

          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: {
                response: parsedContent.response,
                suggestions: parsedContent.suggestions || [],
                codeSnippets: parsedContent.codeSnippets || [],
                references: parsedContent.references || [],
              },
              id: `code-${Date.now()}`,
            },
          ]);
        } catch (error) {
          console.error("API Error:", error);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Sorry, there was an error processing your request.",
              id: `error-${Date.now()}`,
            },
          ]);
        }
      }

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      const botMessage = messages.find((msg) => msg.type === "bot");
      if (botMessage) {
        handleVoiceResponse(botMessage);
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.id?.startsWith("loading")),
        {
          type: "bot",
          content: "Sorry, there was an error processing your request.",
          id: `error-${Date.now()}`,
        },
      ]);
    } finally {
      setInputValue("");
    }

    setInputValue("");
  };

  const handleModifyEmail = async (modificationPrompt: string) => {
    if (!selectedMessage || !selectedMessage.content) return;

    const timestamp = Date.now();
    const userModRequest = {
      type: "user" as const,
      content: `Modification request: ${modificationPrompt}`,
      id: `mod-request-${timestamp}`,
    };
    setMessages((prev) => [...prev, userModRequest]);

    try {
      const result = await generateEmail(
        "",
        "professional",
        {
          sender: {
            name: userInfo.name,
            role: userInfo.jobRole,
            company: userInfo.company,
            email: userInfo.email,
          },
        },
        {
          originalContent:
            typeof selectedMessage.content === "string"
              ? selectedMessage.content
              : "",
          modificationRequest: modificationPrompt,
        }
      );

      if (result) {
        const formattedEmail = `From: ${userInfo.name}
Role: ${userInfo.jobRole}
Company: ${userInfo.company}
Email: ${userInfo.email}

Subject: ${result.subject}

${result.content}`;

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: formattedEmail,
            id: `mod-result-${Date.now()}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Modification error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Sorry, there was an error modifying the email.",
          id: `mod-error-${Date.now()}`,
        },
      ]);
    }

    setIsModifying(false);
    setSelectedMessage(null);
    setInputValue("");
  };

  const isEmailContent = (content: string) => {
    return content.includes("From:") && content.includes("Subject:");
  };

  const isPresentationContent = (content: string) => {
    return content.includes("Title:") && content.includes("Slide");
  };

  const handleModifyPresentation = async (modificationPrompt: string) => {
    if (!selectedMessage || !selectedMessage.content) return;

    const timestamp = Date.now();
    const userModRequest = {
      type: "user" as const,
      content: `Modification request: ${modificationPrompt}`,
      id: `mod-request-${timestamp}`,
    };
    setMessages((prev) => [...prev, userModRequest]);

    try {
      const result = await generatePresentation(
        modificationPrompt,
        selectedAudience || "general",
        "presentation",
        {
          originalContent:
            typeof selectedMessage.content === "string"
              ? selectedMessage.content
              : "",
          modificationRequest: modificationPrompt,
        }
      );

      if (result) {
        const formattedPresentation = `Title: ${result.title}\n\n${result.slides
          .map(
            (slide, index) =>
              `Slide ${index + 1}: ${slide.title}\n${slide.content}`
          )
          .join("\n\n")}`;

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: formattedPresentation,
            id: `mod-presentation-${Date.now()}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Modification error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: "Sorry, there was an error modifying the presentation.",
          id: `mod-error-${Date.now()}`,
        },
      ]);
    }

    setIsModifying(false);
    setSelectedMessage(null);
    setInputValue("");
  };

  // Update the startScreenShare function:
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window",
          logicalSurface: true,
          cursor: "always",
          // Specifically request system-level windows
          systemAudio: "include",
          surfaceSwitching: "include",
          selfBrowserSurface: "exclude",
        } as MediaTrackConstraints,
        audio: {
          // Include system audio
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Check if we got a window capture
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log("Capture settings:", settings);

        // Add track ended listener
        videoTrack.addEventListener("ended", () => {
          stopScreenShare();
        });
      }

      setMediaStream(stream);
      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error sharing screen:", error);
      // Show a more helpful error message
      if ((error as Error).name === "NotAllowedError") {
        setErrorMessage(
          "Please allow screen sharing permissions to share VS Code or other windows."
        );
      } else {
        setErrorMessage(
          "Error sharing screen. Please make sure you have screen sharing permissions enabled."
        );
      }
      setShowError(true);
    }
  };

  const stopScreenShare = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsScreenSharing(false);
  };

  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const toggleVoiceInput = () => {
    if (isListening || voiceAssistantActive) {
      speechService.stopListening();
      setIsListening(false);
      setVoiceAssistantActive(false);
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
      setInputValue("");
    } else {
      setVoiceAssistantActive(false);
      let currentInput = "";
      const SUBMIT_DELAY = 3000;

      speechService.startListening(
        (text) => {
          currentInput = text;
          setInputValue(text);

          // Clear any existing timeout
          if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
          }
        },
        () => {
          // Set a single timeout for submission
          if (currentInput.trim()) {
            messageTimeoutRef.current = setTimeout(() => {
              setIsListening(false);
              const submitButton = document.querySelector(
                'button[type="submit"]'
              );
              if (submitButton) {
                (submitButton as HTMLButtonElement).click();
              }
            }, SUBMIT_DELAY);
          }
        }
      );
      setIsListening(true);
    }
  };

  const handleAlertConfirm = () => {
    if (pendingFeature) {
      stopScreenShare();
      switchFeature(pendingFeature);
    }
    setShowAlert(false);
    setPendingFeature(null);
  };

  const handleAlertCancel = () => {
    setShowAlert(false);
    setPendingFeature(null);
  };

  const handleUseAsPrompt = (text: string) => {
    // Format the text by cleaning and normalizing
    const formattedText = text
      .split("\n")
      .map((line) => {
        return line
          .replace(/[^\w\s.!?,'"()-]/g, " ")
          .replace(/[←→↑↓≤≥«»■●◆□△▲▼→←↔↕⇄⇅≈~]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      })
      .filter((line) => {
        const lowercaseLine = line.toLowerCase();
        return (
          line.length > 0 &&
          !lowercaseLine.includes("lines:") &&
          !lowercaseLine.includes("undefined") &&
          !lowercaseLine.includes("null") &&
          !lowercaseLine.includes("[object") &&
          !lowercaseLine.match(/^\d+$/) &&
          !lowercaseLine.match(/^[\W_]+$/) &&
          !lowercaseLine.match(/^v\s*$/i) &&
          !lowercaseLine.match(/^[<>=\-—_|]+$/)
        );
      })
      .join("\n")
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .trim();

    // Set the formatted text as input value
    setInputValue(formattedText);

    // Use setTimeout to ensure state update has completed
    setTimeout(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        // Reset height first
        textarea.style.height = "auto";

        // Force a reflow
        void textarea.offsetHeight;

        // Set new height based on scrollHeight
        const newHeight = Math.min(textarea.scrollHeight, 300);
        textarea.style.height = `${newHeight}px`;

        // Set overflow based on content height
        textarea.style.overflowY =
          textarea.scrollHeight > 300 ? "auto" : "hidden";

        // Focus and scroll into view
        textarea.focus();
        textarea.scrollIntoView({ behavior: "smooth", block: "center" });

        // Select the text for easy editing
        (textarea as HTMLTextAreaElement).select();
      }
    }, 0);
  };

  const handleVoiceModeStart = useCallback(() => {
    setIsVoiceModeActive(true);
  }, []);
  


  // Update the main container layout
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      {" "}
      {/* Changed background */}
      <Header isFormCompleted={!!userInfo} />
      <main className="flex-1 p-2 md:p-3 lg:p-4 overflow-hidden mt-20">
        <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-7rem)] max-w-[1800px] mx-auto w-full">
          {/* Main Chat Section */}
          <div
            className="flex-1 backdrop-blur-lg bg-gradient-to-b from-black/40 to-[#0a0a0f]/90 
                     rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-0 
                     border border-purple-900/30 relative"
          >
            {/* Add animated background */}
            {/* <div className="absolute inset-0 z-0">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(#2a1458 1px, transparent 1px),
                               linear-gradient(90deg, #2a1458 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
                opacity: 0.1
              }}></div>
            </div> */}

            {/* Sidebar */}
            <div
              className="w-full md:w-[280px] backdrop-blur-2xl bg-black/20 
                      border-r border-purple-900/30 flex flex-col shrink-0 z-10"
            >
              <div className="p-6">
                <div className="mb-8">
                  <h1
                    className="text-4xl font-bold bg-clip-text text-transparent 
                             bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600"
                  >
                    BudX
                  </h1>
                  <p className="text-gray-300 mt-2">Smarter Than Your Ex 💀</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h2 className="text-gray-400 font-medium mb-3 flex items-center text-sm uppercase tracking-wider">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Features
                    </h2>
                    <div className="space-y-1">
                      {features.map((feature) => (
                        <button
                          key={feature.id}
                          onClick={() => handleFeatureSelect(feature.id)}
                          data-active={selectedFeature === feature.id}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg 
                               transition-all duration-300 text-gray-400 
                               hover:bg-purple-600/20 hover:text-white
                               data-[active=true]:bg-gradient-to-r 
                               data-[active=true]:from-purple-600/20 
                               data-[active=true]:to-pink-600/20 
                               data-[active=true]:text-white
                               data-[active=true]:shadow-[0_0_20px_rgba(147,51,234,0.2)]"
                        >
                          <feature.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm">{feature.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedFeature === "presentation" && (
                    <div>
                      <h2 className="text-gray-400 font-medium mb-3 flex items-center text-sm uppercase tracking-wider">
                        <Users className="h-4 w-4 mr-2" />
                        Target Audience
                      </h2>
                      <div className="space-y-1">
                        {audiences.map((audience) => (
                          <button
                            key={audience.id}
                            onClick={() => handleAudienceSelect(audience.id)}
                            data-active={selectedAudience === audience.id}
                            className="w-full flex items-center space-x-3 px-4 py-3 
                                 rounded-lg transition-all duration-300 
                                 text-gray-400 hover:bg-purple-600/20 hover:text-white
                                 data-[active=true]:bg-gradient-to-r 
                                 data-[active=true]:from-purple-600/20 
                                 data-[active=true]:to-pink-600/20 
                                 data-[active=true]:text-white"
                          >
                            <audience.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm">{audience.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 z-10">
              {selectedFeature === "codeAssist" && !hasStartedChat ? (
                // Show CodeAssistModeSelector only when codeAssist is selected and chat hasn't started
                <div className="flex-1 flex items-center justify-center">
                  <div className="max-w-[900px] w-full mx-auto px-4">
                  <CodeAssistModeSelector
                      currentMode={codeAssistMode}
                      onModeSelect={(mode) => {
                        setCodeAssistMode(mode);
                        if (mode === 'voice') {
                          handleVoiceModeStart();
                        } else if (isScreenSharing && mode !== "screen") {
                          stopScreenShare();
                        }
                      }}
                      startScreenShare={startScreenShare}
                    />
                  </div>
                </div>
              ) : (
                // Show messages for all features or when chat has started
                <div
                  className={`p-3 md:p-6 overflow-y-auto flex-1 space-y-4 ${styles.chatScroll}`}
                >
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col max-w-full">
                      <div
                        className={`flex ${
                          message.type === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[95%] md:max-w-[85%] lg:max-w-[80%] rounded-2xl 
                                  px-4 md:px-6 py-3 md:py-4 shadow-lg ${
                                    message.type === "user"
                                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                      : "backdrop-blur-lg bg-white/5 border border-purple-900/30 text-white"
                                  }`}
                        >
                          {message.content === "loading" ? (
                            <LoadingDots />
                          ) : typeof message.content === "string" ? (
                            <pre className="whitespace-pre-line">
                              {message.content}
                            </pre>
                          ) : (
                            <div className="space-y-6">
                              {/* Main Response */}
                              <div
                                className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 
                                            backdrop-blur-sm rounded-lg p-4 
                                            border border-purple-900/30 
                                            shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                              >
                                <FormattedResponse
                                  content={message.content.response}
                                />
                              </div>

                              {/* Code Snippets */}
                              {message.content.codeSnippets?.map(
                                (snippet, index) => (
                                  <div
                                    key={index}
                                    className="rounded-lg overflow-hidden bg-[#2A2B2D]"
                                  >
                                    <div className="px-4 py-2 bg-[#202124] border-b border-[#ffffff0f] flex justify-between items-center">
                                      <h3 className="text-sm font-medium text-white">
                                        {snippet.title}
                                      </h3>
                                      <div className="text-xs text-[#ffffff66]">
                                        {snippet.language}
                                      </div>
                                    </div>
                                    <div className="p-4">
                                      <CodeBlock
                                        code={snippet.code}
                                        language={snippet.language}
                                      />
                                      {snippet.explanation && (
                                        <p className="mt-4 text-sm text-[#ffffff99]">
                                          {snippet.explanation}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}

                              {/* Suggestions */}
                              {message.content.suggestions &&
                                message.content.suggestions.length > 0 && (
                                  <div className="rounded-lg bg-[#2A2B2D]/50 p-4">
                                    <h3 className="text-sm font-medium text-white mb-2">
                                      Best Practices
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1">
                                      {message.content.suggestions.map(
                                        (suggestion, index) => (
                                          <li
                                            key={index}
                                            className="text-sm text-[#ffffff99]"
                                          >
                                            {suggestion}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {/* References */}
                              {(message.content.references ?? []).length > 0 && (
                                <div className="mt-4 border-t border-[#ffffff0f] pt-4">
                                  <h3 className="text-sm font-medium text-white mb-2">
                                    Additional Resources
                                  </h3>
                                  <ul className="space-y-1">
                                    {message.content.references?.map(
                                      (ref, index) => (
                                        <li key={index}>
                                          <a
                                            href={ref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-[#8AB4F8] hover:underline"
                                          >
                                            {ref}
                                          </a>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modification buttons for email and presentation */}
                      {message.type === "bot" &&
                        typeof message.content === "string" && (
                          <div className="flex justify-start mt-2">
                            {isEmailContent(message.content) && (
                              <button
                                onClick={() => {
                                  setSelectedMessage(message);
                                  setIsModifying(true);
                                  setSelectedFeature("email");
                                }}
                                className="text-sm text-[#8AB4F8] hover:text-white transition-colors"
                              >
                                Modify Email
                              </button>
                            )}
                            {isPresentationContent(message.content) && (
                              <button
                                onClick={() => {
                                  setSelectedMessage(message);
                                  setIsModifying(true);
                                  setSelectedFeature("presentation");
                                }}
                                className="text-sm text-[#8AB4F8] hover:text-white transition-colors ml-2"
                              >
                                Modify Presentation
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
              {/* Input Area */}
              <div className="border-t border-purple-900/30 bg-black/20 backdrop-blur-lg">
                <div className="max-w-[900px] w-full p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isModifying) {
                        if (selectedFeature === "email") {
                          handleModifyEmail(inputValue);
                        } else if (selectedFeature === "presentation") {
                          handleModifyPresentation(inputValue);
                        }
                      } else {
                        handleSubmit(e);
                      }
                    }}
                    className="max-w-4xl mx-auto"
                  >
                    <div className="relative flex items-center">
                      <textarea
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          e.target.style.height = "auto";
                          const newHeight = Math.min(
                            e.target.scrollHeight,
                            300
                          );
                          e.target.style.height = `${newHeight}px`;
                          e.target.style.overflowY =
                            e.target.scrollHeight > 300 ? "auto" : "hidden";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const formEvent = new Event("submit", {
                              cancelable: true,
                            });
                            handleSubmit(
                              formEvent as unknown as React.FormEvent
                            );
                          }
                        }}
                        placeholder={
                          isModifying
                            ? "Enter modification instructions..."
                            : "Message BudX ... (Shift+Enter for new line)"
                        }
                        style={{
                          height: "auto",
                          minHeight: "44px",
                          maxHeight: "300px",
                          resize: "none",
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.5",
                          overflowY: "auto",
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          scrollbarWidth: "thin",
                          scrollbarColor:
                            "rgba(255, 255, 255, 0.1) transparent",
                        }}
                        className="w-full rounded-lg bg-white/5 border border-purple-900/30 
                                text-white placeholder-gray-400
                                focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 
                                transition-all duration-300
                                px-4 md:px-6 py-3
                                pr-[144px] md:pr-[156px]"
                      />
                      <div className="absolute right-2 flex items-center space-x-1 md:space-x-2">
                      {selectedFeature === "codeAssist" && codeAssistMode === "screen" && (
                            <button
                              type="button"
                              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                              className={`p-2 rounded-full transition-colors ${
                                isScreenSharing
                                  ? "text-red-500 hover:text-red-400"
                                  : "text-[#ffffff99] hover:text-[#8AB4F8]"
                              }`}
                            >
                              <Share2 className="h-4 md:h-5 w-4 md:w-5" />
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={toggleVoiceInput}
                          className={`p-2 rounded-full transition-colors relative ${
                            isListening
                              ? "text-purple-500"
                              : "text-[#ffffff99] hover:text-[#8AB4F8]"
                          }`}
                        >
                          {isListening ? (
                            <>
                              <div className="absolute inset-0 rounded-full animate-pulse bg-purple-500/20"></div>
                              <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/20"></div>
                              <Mic className="h-4 md:h-5 w-4 md:w-5 relative animate-pulse" />
                            </>
                          ) : (
                            <Mic className="h-4 md:h-5 w-4 md:w-5" />
                          )}
                        </button>
                        <button
                          type="submit"
                          ref={submitButtonRef}
                          className="text-gray-400 hover:text-purple-400 p-2 
                       rounded-full transition-colors duration-300"
                        >
                          <Send className="h-4 md:h-5 w-4 md:w-5" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Data Section */}
          {(isScreenSharing || mediaStream) && (
            <div
              className="w-full lg:w-[400px] backdrop-blur-lg 
                    bg-gradient-to-b from-white/10 to-white/5 
                    rounded-2xl border border-purple-900/30"
            >
              {/* Video Container */}
              <div className="relative h-[150px] md:h-[200px] bg-[#202124] border-b border-[#ffffff1a]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-[#ffffff99]">
                    {screenAnalysis ? (
                      <div className="flex flex-col items-center space-y-1">
                        <span>{screenAnalysis.window}</span>
                        <span>{screenAnalysis.resolution}</span>
                      </div>
                    ) : (
                      "Starting analysis..."
                    )}
                  </div>
                </div>
                {mediaStream && (
                  <>
                    <video
                      ref={(video) => {
                        if (video && mediaStream) video.srcObject = mediaStream;
                      }}
                      autoPlay
                      className="w-full h-full object-cover opacity-90"
                    />
                    <ImageProcessor
                      mediaStream={mediaStream}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                    <div className="absolute bottom-2 left-2 bg-[#202124]/80 px-2 py-1 rounded text-xs text-[#ffffff99]">
                      {screenAnalysis?.frameRate || "30 fps"}
                    </div>
                  </>
                )}
                <button
                  onClick={stopScreenShare}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Use ScreenDataDisplay component */}
              <ScreenDataDisplay
                data={screenAnalysis || {}}
                isLive={isScreenSharing}
                onUseAsPrompt={handleUseAsPrompt}
              />
            </div>
          )}
          {codeAssistMode === 'voice' && (
            <VoiceMode
              isActive={isVoiceModeActive}
              onSpeechResult={(text) => {
                if (text.trim()) {
                  // Append new message instead of replacing
                  setMessages(prev => [...prev, {
                    type: 'user',
                    content: text,
                    id: `speech-${Date.now()}` // Unique ID for each message
                  }]);
                  setHasStartedChat(true);
                }
              }}
              onResponse={(response) => {
                // Append new bot message instead of replacing
                setMessages(prev => [...prev, {
                  type: 'bot',
                  content: response,
                  id: `ai-response-${Date.now()}` // Unique ID for each response
                }]);
              }}
            />
          )}
        </div>
      </main>
      <AlertDialog
        open={showAlert}
        title="Stop Screen Sharing"
        message="Switching features will stop screen sharing. Do you want to continue?"
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
      />
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{
            bgcolor: "#2A2B2D",
            color: "#fff",
            "& .MuiAlert-icon": { color: "#ef4444" },
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      <VoiceAssistant
        isActive={voiceAssistantActive}
        message={currentVoiceMessage}
        onComplete={() => setCurrentVoiceMessage("")}
        voiceConfig={voiceConfig}
      />
    </div>
  );
};

export default ChatInterface;
