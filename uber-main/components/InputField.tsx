import React, { forwardRef } from "react";
import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

import { InputFieldProps } from "@/types/type";

const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      icon,
      secureTextEntry = false,
      labelStyle,
      containerStyle,
      inputStyle,
      iconStyle,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <View className="mb-6 w-full">
        <Text
          className={`text-[10px] font-JakartaBold mb-2 uppercase tracking-widest text-neutral-600 ${labelStyle}`}
        >
          {label}
        </Text>
        <View
          className={`flex flex-row justify-start items-center relative bg-dark-100 h-[60px] rounded-[24px] border border-neutral-900 focus:border-white/20  ${containerStyle}`}
        >
          {icon && (
            <Image
              source={icon}
              className={`w-5 h-5 ml-5 tint-neutral-500 ${iconStyle}`}
            />
          )}
          <TextInput
            className={`rounded-[24px] px-5 font-JakartaMedium text-[15px] flex-1 ${inputStyle} text-left text-white`}
            secureTextEntry={secureTextEntry}
            placeholderTextColor="#555"
            ref={ref}
            {...props}
          />
        </View>
      </View>
    );
  },
);

export default InputField;
