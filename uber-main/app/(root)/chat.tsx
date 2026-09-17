import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRideStore } from "@/store/rideStore";

const Chat = () => {
  const { rideId: paramRideId } = useLocalSearchParams<{ rideId?: string }>();
  const { matchedDriver, currentRideId } = useRideStore();
  const { user } = useAuth();
  const rideId = paramRideId || currentRideId;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!rideId || !user?.id) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });
      if (data?.length) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            text: m.text,
            sender: m.sender_id === user.id ? "user" : "driver",
            time: new Date(m.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      } else {
        setMessages([]);
      }
    };
    loadMessages();

    const channel = supabase
      .channel(`ride_chat_${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) => [
            ...prev,
            {
              id: m.id,
              text: m.text,
              sender: m.sender_id === user.id ? "user" : "driver",
              time: new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
          scrollRef.current?.scrollToEnd({ animated: true });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, user?.id]);

  const handleCall = () => {
    if (matchedDriver?.phone) {
      Linking.openURL(`tel:${matchedDriver.phone}`);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !user || !rideId) return;
    const text = message.trim();
    setMessage("");
    const rideIdParam = rideId;

    const tempMsg = {
      id: Date.now(),
      text,
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, tempMsg]);
    scrollRef.current?.scrollToEnd({ animated: true });

    await supabase.from("messages").insert({
      ride_id: rideIdParam,
      sender_id: user.id,
      text,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-2 flex-row items-center justify-between mb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-neutral-900 rounded-full items-center justify-center border border-neutral-800"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-lg font-JakartaExtraBold">
            {matchedDriver?.name || "Driver"}
          </Text>
          <Text className="text-neutral-500 text-[10px] uppercase font-JakartaBold tracking-[4px]">
            Direct Message
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCall}
          className="w-10 h-10 bg-white rounded-full items-center justify-center"
        >
          <Ionicons name="call" size={18} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        className="px-5 flex-1"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`flex-row mb-6 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "driver" && (
              <View className="w-8 h-8 rounded-full bg-neutral-900 overflow-hidden items-center justify-center mr-3">
                <Ionicons name="person" size={16} color="#777" />
              </View>
            )}
            <View
              className={`max-w-[80%] p-4 rounded-[24px] ${
                msg.sender === "user"
                  ? "bg-blue-600 rounded-tr-none"
                  : "bg-neutral-900 rounded-tl-none"
              }`}
            >
              <Text className="text-white text-[15px] font-JakartaMedium leading-5">
                {msg.text}
              </Text>
              <View className="flex-row items-center justify-end mt-2">
                <Text className="text-white/40 text-[9px] font-JakartaBold">
                  {msg.time}
                </Text>
                {msg.sender === "user" && (
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color="rgba(255,255,255,0.4)"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>
          </View>
        ))}

        <View className="bg-dark-100 p-5 rounded-[32px] border border-neutral-900 flex-row items-center mb-10 mt-4">
          <View className="w-12 h-12 bg-black rounded-2xl items-center justify-center border border-neutral-800">
            <Ionicons name="car" size={24} color="white" />
          </View>
          <View className="ml-5">
            <Text className="text-white text-sm font-JakartaExtraBold">
              Assigned Vehicle
            </Text>
            <Text className="text-neutral-600 text-[10px] uppercase font-JakartaBold tracking-widest mt-1">
              {matchedDriver?.car || "Luxury Sedan"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        className="px-5 pb-8"
      >
        <View className="bg-neutral-900 flex-row items-center px-6 py-3 rounded-[32px] border border-white/5">
          <TextInput
            placeholder="Message your driver..."
            placeholderTextColor="#666"
            className="flex-1 text-white font-JakartaMedium text-sm h-[48px]"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${message ? "bg-white" : "bg-neutral-800"}`}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={message ? "black" : "#444"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
