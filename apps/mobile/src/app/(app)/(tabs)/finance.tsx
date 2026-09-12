import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Wallet, TrendingUp, TrendingDown } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useFinanceSummary, useTransactions } from "@/features/finance/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatCurrency } from "@/lib/format/currency";
import { formatShortDate } from "@/lib/format/date";

export default function FinanceScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const summary = useFinanceSummary();
  const transactions = useTransactions(15);

  return (
    <Screen
      onRefresh={() => {
        summary.refetch();
        transactions.refetch();
      }}
      refreshing={summary.isRefetching || transactions.isRefetching}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="largeTitle">Finance</Text>
        <Pressable
          onPress={() => router.push("/modals/add-transaction")}
          accessibilityRole="button"
          accessibilityLabel="Add transaction"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color={theme.colors.onBrand} />
        </Pressable>
      </View>

      {summary.isPending ? (
        <SkeletonList rows={3} />
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={summary.refetch} />
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <StatTile label="Income this month" value={formatCurrency(summary.data.incomeCents)} icon={TrendingUp} tone="success" />
            <StatTile label="Expenses this month" value={formatCurrency(summary.data.expenseCents)} icon={TrendingDown} tone="danger" />
          </View>

          <Card>
            <Text variant="subtitle">Budgets this month</Text>
            {summary.data.budgets.length === 0 ? (
              <EmptyState icon={Wallet} title="No budgets set" description="Set budgets on the web app to track them here." />
            ) : (
              <View style={{ gap: theme.spacing.md }}>
                {summary.data.budgets.map((budget) => {
                  const pct = budget.monthlyLimitCents > 0 ? (budget.spentCents / budget.monthlyLimitCents) * 100 : 0;
                  const over = budget.spentCents > budget.monthlyLimitCents;
                  return (
                    <View key={budget.id} style={{ gap: 4 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text variant="body">{budget.category.name}</Text>
                        <Text variant="caption" color={over ? "danger" : "muted"}>
                          {formatCurrency(budget.spentCents)} / {formatCurrency(budget.monthlyLimitCents)}
                        </Text>
                      </View>
                      <ProgressBar value={pct} tone={over ? "danger" : "brand"} />
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          {summary.data.billsDueSoon.length > 0 ? (
            <Card>
              <Text variant="subtitle">Bills due soon</Text>
              {summary.data.billsDueSoon.map((bill) => (
                <View key={bill.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text variant="body">{bill.name}</Text>
                  <Text variant="body" color="muted">
                    {formatCurrency(bill.amountCents)} · {formatShortDate(bill.nextDueDate)}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}

      <View>
        <Text variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
          Recent transactions
        </Text>
        {transactions.isPending ? (
          <SkeletonList rows={4} />
        ) : transactions.isError ? (
          <ErrorState error={transactions.error} onRetry={transactions.refetch} />
        ) : !transactions.data || transactions.data.length === 0 ? (
          <EmptyState icon={Wallet} title="No transactions yet" description="Add your first expense above." />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {transactions.data.map((transaction) => (
              <Card key={transaction.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: transaction.category?.color ?? theme.colors.mutedText }}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="body" numberOfLines={1}>
                    {transaction.description || transaction.category?.name || (transaction.type === "INCOME" ? "Income" : "Expense")}
                  </Text>
                  <Text variant="caption" color="muted">
                    {formatShortDate(transaction.occurredAt)}
                  </Text>
                </View>
                <Text variant="bodyStrong" color={transaction.type === "INCOME" ? "success" : "default"}>
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(transaction.amountCents)}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
