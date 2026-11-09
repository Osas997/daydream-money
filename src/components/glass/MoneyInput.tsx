import React from 'react';
import { InputText } from './InputText';
import { formatMoneyInput } from '../../lib/formatters';

type MoneyInputProps = React.ComponentProps<typeof InputText>;

/**
 * Drop-in replacement for `InputText` for money fields. Keeps thousand
 * separators visible while the user types ("1500000" -> "1.500.000") and
 * still allows the shorthand accepted by `parseNominal` ("50rb", "1.5jt").
 */
export function MoneyInput({ value, onChangeText, ...props }: MoneyInputProps) {
  return (
    <InputText
      keyboardType="numeric"
      {...props}
      value={value}
      onChangeText={(text) => onChangeText?.(formatMoneyInput(text, value))}
    />
  );
}
