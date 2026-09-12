import { useState } from "react";
import { useRouter } from "expo-router";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { useCreateNote } from "@/features/notes/api";
import { fireCreateMutation } from "@/lib/forms/fire-create-mutation";

export default function CreateNoteModal() {
  const router = useRouter();
  const createNote = useCreateNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    fireCreateMutation({
      mutateAsync: () => createNote.mutateAsync({ title: title.trim() || undefined, contentMd: content }),
      onNavigateAway: () => router.back(),
      onError: setError,
    });
  }

  return (
    <Screen edges={["bottom", "left", "right"]}>
      <TextField label="Title (optional)" value={title} onChangeText={setTitle} autoFocus placeholder="Untitled note" />
      <TextField
        label="Note"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={8}
        style={{ minHeight: 160, textAlignVertical: "top" }}
        placeholder="Write something..."
      />
      {error ? (
        <Text color="danger" variant="caption">
          {error}
        </Text>
      ) : null}
      <Button label="Save note" onPress={handleSubmit} loading={createNote.isPending} fullWidth size="lg" />
    </Screen>
  );
}
