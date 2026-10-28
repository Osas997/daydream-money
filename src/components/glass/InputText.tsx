import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  Pressable,
} from 'react-native';
import { colors, radius, shadow } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface InputTextProps extends TextInputProps {
  icon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function InputText({
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputTextProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.inner,
          shadow.card,
          isFocused ? styles.focused : styles.unfocused,
        ]}
      >
        {icon && (
          <AppIcon
            name={icon}
            size={18}
            color={isFocused ? colors.primary : colors.onSurfaceMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          placeholderTextColor={colors.onSurfaceMuted}
          style={[typography.bodyMd, styles.input, style]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconPressable}
          >
            <AppIcon
              name={rightIcon}
              size={18}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  unfocused: {
    borderColor: colors.glass.borderSoft,
  },
  focused: {
    borderColor: colors.primary,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIconPressable: {
    marginLeft: 10,
    padding: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: colors.onSurface,
    fontSize: 13,
  },
});
