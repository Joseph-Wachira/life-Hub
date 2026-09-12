import { useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import type { TransactionType } from "@lifehub/shared";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useFinanceSummary, useCreateTransaction } from "@/features/finance/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { fireCreateMutation } from "@/lib/forms/fire-create-mutation";

type DayOption = "today" | "yesterday";

export default function AddTransactionModal() {
  const theme = useAppTheme();
  const router = useRouter();
  const { data: summary } = useFinanceSummary();
  const createTransaction = useCreateTransaction();

  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [day, setDay] = useState<DayOption>("today");
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => (summary?.categories ?? []).filter((c) => c.type === type), [summary, type]);

  function handleSubmit() {
    const amountCents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!amount || Number.isNaN(amountCents) || amountCents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);
    const occurredAt = new Date();
    if (day === "yesterday") occurredAt.setDate(occurredAt.getDate() - 1);

    fireCreateMutation({
      mutateAsync: () =>
        createTransaction.mutateAsync({
          type,
          amountCents,
          categoryId,
          description: description.trim() || undefined,
          occurredAt,
        }),
      onNavigateAway: () => router.back(),
      onError: setError,
    });
  }

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <SegmentedControl
        value={type}
        onChange={(value) => {
          setType(value);
          setCategoryId(undefined);
        }}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />
      <TextField label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" autoFocus />

      {categories.length > 0 ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="label" color="muted">
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map((category) => {
              const selected = categoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(selected ? undefined : category.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: theme.radii.pill,
                    backgroundColor: selected ? category.color : theme.colors.surfaceSunken,
                  }}
                >
                  <Text variant="label" style={{ color: selected ? "#ffffff" : theme.colors.text }}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <TextField label="Description (optional)" value={description} onChangeText={setDescription} placeholder="What was it for?" />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="label" color="muted">
          Date
        </Text>
        <SegmentedControl
          value={day}
          onChange={setDay}
          options={[
            { value: "today", label: "Today" },
            { value: "yesterday", label: "Yesterday" },
          ]}
        />
      </View>

      {error ? (
        <Text color="danger" variant="caption">
          {error}
        </Text>
      ) : null}

      <Button
        label={`Add ${type === "EXPENSE" ? "expense" : "income"}`}
        onPress={handleSubmit}
        loading={createTransaction.isPending}
        fullWidth
        size="lg"
      />
    </Screen>
  );
}
