import { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { NotebookText, Plus, Pin } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useNotes } from "@/features/notes/api";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatShortDate } from "@/lib/format/date";
import { stripMarkdown } from "@/lib/format/markdown";

export default function NotesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data, isPending, isError, error, refetch, isRefetching } = useNotes(query || undefined);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="largeTitle">Notes</Text>
        <Pressable
          onPress={() => router.push("/modals/create-note")}
          accessibilityRole="button"
          accessibilityLabel="New note"
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

      <TextField placeholder="Search notes" value={query} onChangeText={setQuery} />

      {isPending ? (
        <SkeletonList rows={4} rowHeight={72} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={NotebookText} title="No notes yet" description="Create your first quick note." />
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {data.map((note) => (
            <Pressable key={note.id} onPress={() => router.push(`/note/${note.id}`)}>
              <Card style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {note.isPinned ? <Pin size={12} color={theme.colors.brand} /> : null}
                  <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {note.title || "Untitled note"}
                  </Text>
                </View>
                {note.contentMd ? (
                  <Text variant="caption" color="muted" numberOfLines={2}>
                    {stripMarkdown(note.contentMd)}
                  </Text>
                ) : null}
                <Text variant="caption" color="subtle">
                  {formatShortDate(note.updatedAt)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
