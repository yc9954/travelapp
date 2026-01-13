import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { openaiService, type ChatMessage } from '../services/openai';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TravelAIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TravelAIChatModal({ visible, onClose }: TravelAIChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasStartedChat = messages.length > 0;
  
  const userProfileImage = user?.profileImage || 'https://cdn-luma.com/public/avatars/avatar-default.jpg';

  useEffect(() => {
    if (visible && messages.length > 0) {
      // 메시지가 추가될 때마다 스크롤을 맨 아래로
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // 사용자 메시지 추가
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // 대화 히스토리 준비 (시스템 메시지 제외)
      const conversationHistory = messages.filter((msg) => msg.role !== 'system');
      
      // OpenAI API 호출
      const response = await openaiService.getTravelRecommendation(
        userMessage,
        conversationHistory
      );

      // AI 응답 추가
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      // 에러 메시지 추가
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `죄송합니다. 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}\n\n다시 시도해주세요.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // 모달 닫을 때 대화 초기화
    setMessages([]);
    setInputText('');
    onClose();
  };

  const quickPrompts = [
    { icon: 'airplane-outline', text: 'Recommend places to visit in Tokyo' },
    { icon: 'sunny-outline', text: 'Best beach destinations for summer' },
    { icon: 'map-outline', text: 'Travel tips for Europe' },
    { icon: 'restaurant-outline', text: 'Must-try foods in Seoul' },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Travel AI Chat</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={styles.contentArea}>
            {!hasStartedChat ? (
              // 초기 화면: 시작 가이드
              <View style={styles.initialScreen}>
                <View style={styles.aiAvatarContainer}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={32} color="#60A5FA" />
                  </View>
                </View>
                
                <View style={styles.welcomeCard}>
                  <Text style={styles.welcomeTitle}>Get Started with Travel AI</Text>
                  <Text style={styles.welcomeDescription}>
                    Ask me only travel-related questions, such as destination recommendations, travel tips, or vacation planning.
                  </Text>
                </View>

                <View style={styles.quickPromptsContainer}>
                  {quickPrompts.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickPromptCard}
                      onPress={() => handleQuickPrompt(prompt.text)}
                    >
                      <Ionicons name={prompt.icon as any} size={20} color="#60A5FA" />
                      <Text style={styles.quickPromptText}>{prompt.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              // 채팅 화면: 메시지 목록
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((message, index) => (
                  <View
                    key={index}
                    style={styles.messageRow}
                  >
                    {message.role === 'assistant' && (
                      <View style={styles.messageAvatar}>
                        <Ionicons name="sparkles" size={20} color="#60A5FA" />
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        message.role === 'user' ? styles.userMessage : styles.assistantMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                    {message.role === 'user' && (
                      <View style={styles.userAvatar}>
                        <Image
                          source={{ uri: userProfileImage }}
                          style={styles.userAvatarImage}
                        />
                      </View>
                    )}
                  </View>
                ))}
                {isLoading && (
                  <View style={styles.messageRow}>
                    <View style={styles.messageAvatar}>
                      <Ionicons name="sparkles" size={20} color="#60A5FA" />
                    </View>
                    <View style={[styles.messageBubble, styles.assistantMessage]}>
                      <ActivityIndicator size="small" color="#60A5FA" />
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>

          {/* Input - Notion Style */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything, search, or create..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={!inputText.trim() || isLoading ? '#9CA3AF' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // 초기 화면 스타일
  initialScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  aiAvatarContainer: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  quickPromptsContainer: {
    gap: 12,
  },
  quickPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  quickPromptText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  // 채팅 화면 스타일
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 12,
    marginTop: 4,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
  },
  messageBubble: {
    flex: 1,
    maxWidth: '75%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  userMessageText: {
    color: '#FFFFFF',
    backgroundColor: '#60A5FA',
  },
  assistantMessageText: {
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
  },
  // 입력 영역 스타일
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
