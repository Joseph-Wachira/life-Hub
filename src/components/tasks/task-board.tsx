"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { TaskStatus } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { positionBetween } from "@/lib/utils";
import { TaskColumn } from "./task-column";
import { TaskCard } from "./task-card";

const BOARD_COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "TODO", title: "To do" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "DONE", title: "Done" },
];

interface TaskBoardProps {
  tasksByStatus: Record<TaskStatus, TaskWithRelations[]>;
  onAddTask: (status: TaskStatus) => void;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
  onStatusChange: (task: TaskWithRelations, status: TaskStatus) => void;
  onMove: (taskId: string, status: TaskStatus, position: number) => void;
  showProject?: boolean;
}

export function TaskBoard({
  tasksByStatus,
  onAddTask,
  onEdit,
  onDelete,
  onStatusChange,
  onMove,
  showProject,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function statusFromOverId(overId: string): TaskStatus | null {
    const columnStatus = BOARD_COLUMNS.find((c) => `column-${c.status}` === overId)?.status;
    if (columnStatus) return columnStatus;
    for (const column of BOARD_COLUMNS) {
      if (tasksByStatus[column.status].some((t) => t.id === overId)) return column.status;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    for (const column of BOARD_COLUMNS) {
      const found = tasksByStatus[column.status].find((t) => t.id === id);
      if (found) {
        setActiveTask(found);
        return;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const targetStatus = statusFromOverId(overId);
    if (!targetStatus) return;

    const siblings = tasksByStatus[targetStatus].filter((t) => t.id !== activeId);
    const overIndex = siblings.findIndex((t) => t.id === overId);
    const insertIndex = overIndex === -1 ? siblings.length : overIndex;

    const before = siblings[insertIndex - 1]?.position ?? null;
    const after = siblings[insertIndex]?.position ?? null;
    const newPosition = positionBetween(before, after);

    onMove(activeId, targetStatus, newPosition);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {BOARD_COLUMNS.map((column) => (
          <TaskColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={tasksByStatus[column.status]}
            onAddTask={() => onAddTask(column.status)}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            showProject={showProject}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1">
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              onStatusChange={() => {}}
              showProject={showProject}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
