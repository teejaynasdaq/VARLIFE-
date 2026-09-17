import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";

interface ImageUploadBoxProps {
  label: string;
  imageUri?: string | null;
  onUpload: (uri: string) => void;
  optional?: boolean;
}

export function ImageUploadBox({
  label,
  imageUri,
  onUpload,
  optional,
}: ImageUploadBoxProps) {
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onUpload(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.uploadBoxContainer}>
      <TouchableOpacity
        style={[styles.uploadBox, imageUri ? styles.uploadBoxSuccess : null]}
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {optional && (
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
        )}
        {imageUri ? (
          <Ionicons name="checkmark-circle" size={32} color="#1C6EF2" />
        ) : (
          <Ionicons name="add" size={28} color="#FFF" />
        )}
      </TouchableOpacity>
      <Text style={styles.uploadBoxLabel}>{label}</Text>
    </View>
  );
}

export function ImagePreview({
  uri,
  onRemove,
}: {
  uri: string;
  onRemove: () => void;
}) {
  return (
    <View style={styles.imagePreviewContainer}>
      <Image source={{ uri }} style={styles.imagePreview} />
      <TouchableOpacity style={styles.removeImageBtn} onPress={onRemove}>
        <Ionicons name="close" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
}

interface WizardInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
  secureTextEntry?: boolean;
}

export function WizardInput(props: WizardInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput style={styles.input} placeholderTextColor="#666" {...props} />
    </View>
  );
}

export function DobInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const handleTextChange = (text: string) => {
    // Only allow numbers and dashes
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
    }
    onChangeText(formatted);
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="DD-MM-YYYY"
        placeholderTextColor="#666"
        keyboardType="numeric"
        maxLength={10}
        value={value}
        onChangeText={handleTextChange}
      />
    </View>
  );
}

export function ValidationMessage({
  message,
  type = "error",
}: {
  message: string;
  type?: "error" | "warning" | "info";
}) {
  if (!message) return null;
  const color =
    type === "error" ? "#FF4D4D" : type === "warning" ? "#FFA500" : "#60A5FA";
  return (
    <View style={styles.validationContainer}>
      <Ionicons name="information-circle-outline" size={14} color={color} />
      <Text style={[styles.validationText, { color }]}>{message}</Text>
    </View>
  );
}

export function PasswordStrengthBar({ password }: { password: string }) {
  const calculateStrength = () => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const score = calculateStrength();
  const getBarColor = (index: number) => {
    if (score === 0) return "#333";
    if (score < 2) return index === 0 ? "#FF4D4D" : "#333"; // Weak
    if (score < 4) return index < 2 ? "#FFA500" : "#333"; // Medium
    return index < 4 ? "#34D399" : "#333"; // Strong
  };

  const getLabel = () => {
    if (score === 0) return "";
    if (score < 2) return "Weak";
    if (score < 4) return "Medium";
    return "Strong";
  };

  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.barsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.strengthBar, { backgroundColor: getBarColor(i) }]}
          />
        ))}
      </View>
      <Text style={styles.strengthLabel}>{getLabel()}</Text>
    </View>
  );
}

interface WizardBottomBarProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function WizardBottomBar({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Next >",
  loading = false,
  disabled = false,
}: WizardBottomBarProps) {
  return (
    <View style={styles.bottomBar}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentStep} of {totalSteps}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={currentStep === 1 || loading}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentStep === 1 ? "#555" : "#FFF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            disabled ? styles.nextButtonDisabled : null,
          ]}
          onPress={onNext}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextButtonText}>{nextLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Upload Box
  uploadBoxContainer: {
    alignItems: "center",
    width: 100,
    marginRight: 16,
    marginBottom: 20,
  },
  uploadBox: {
    width: 90,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  uploadBoxSuccess: {
    backgroundColor: "rgba(28,110,242,0.20)",
    borderColor: "rgba(28,110,242,0.60)",
    borderWidth: 1.5,
  },
  uploadBoxLabel: {
    color: "#FFF",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  optionalBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#555",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  optionalText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Image Preview
  imagePreviewContainer: {
    position: "relative",
    marginRight: 16,
    marginBottom: 20,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF3B30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    color: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    fontWeight: "500",
  },

  // Validation
  validationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 12,
    marginLeft: 4,
  },

  // Password Strength
  passwordStrengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  barsContainer: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  strengthLabel: {
    fontSize: 12,
    color: "#888",
    width: 50,
    textAlign: "right",
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 16,
    paddingBottom: 20,
  },
  progressContainer: {
    flex: 1,
    marginRight: 20,
    paddingBottom: 8,
  },
  progressText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#1C6EF2",
    borderRadius: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  nextButton: {
    backgroundColor: "rgba(28,110,242,0.22)",
    borderWidth: 1.3,
    borderColor: "rgba(28,110,242,0.55)",
    paddingHorizontal: 30,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#1C6EF2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 5,
  },
  nextButtonDisabled: {
    backgroundColor: "rgba(28,110,242,0.08)",
    borderColor: "rgba(28,110,242,0.20)",
  },
  nextButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
