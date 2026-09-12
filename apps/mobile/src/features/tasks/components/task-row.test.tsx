import { render, fireEvent } from "@testing-library/react-native";
import type { MobileTask } from "@lifehub/shared";
import { TaskRow } from "./task-row";

const baseTask: MobileTask = {
  id: "t1",
  title: "Write tests",
  description: null,
  status: "TODO",
  priority: "HIGH",
  dueAt: null,
  completedAt: null,
  projectId: null,
  project: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("TaskRow", () => {
  it("renders the task title", async () => {
    const { getByText } = await render(<TaskRow task={baseTask} onToggle={jest.fn()} />);
    expect(getByText("Write tests")).toBeTruthy();
  });

  it("calls onToggle(true) when an open task's checkbox is pressed", async () => {
    const onToggle = jest.fn();
    const { getByRole } = await render(<TaskRow task={baseTask} onToggle={onToggle} />);
    fireEvent.press(getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("calls onToggle(false) when a done task's checkbox is pressed", async () => {
    const onToggle = jest.fn();
    const { getByRole } = await render(<TaskRow task={{ ...baseTask, status: "DONE" }} onToggle={onToggle} />);
    fireEvent.press(getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("calls onPress when the row is tapped", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<TaskRow task={baseTask} onToggle={jest.fn()} onPress={onPress} />);
    fireEvent.press(getByText("Write tests"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
