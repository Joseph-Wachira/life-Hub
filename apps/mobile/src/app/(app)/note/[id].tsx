import { useEffect, useState } from "react";
import { View, Switch } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useNote, useUpdateNote } from "@/features/notes/api";
import { useAppTheme } from "@/theme/use-app-theme";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const { data: note, isPending, isError, error, refetch } = useNote(id ?? null);
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.contentMd);
      setPinned(note.isPinned);
    }
  }, [note]);

  if (isPending) {
    return (
      <Screen>
        <SkeletonList rows={4} />
      </Screen>
    );
  }
  if (isError || !note) {
    return (
      <Screen>
        <ErrorState error={error} title={!note ? "Note not found" : undefined} onRetry={refetch} />
      </Screen>
    );
  }

  function handleSave() {
    if (!note) return;
    updateNote.mutate({ id: note.id, patch: { title: title.trim() || "Untitled note", contentMd: content, isPinned: pinned } });
  }

  return (
    <Screen>
      <TextField label="Title" value={title} onChangeText={setTitle} />
      <TextField
        label="Content"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={10}
        style={{ minHeight: 180, textAlignVertical: "top" }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="body">Pinned</Text>
        <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: theme.colors.brand }} />
      </View>
      <Button label="Save" onPress={handleSave} loading={updateNote.isPending} fullWidth />
    </Screen>
  );
}
