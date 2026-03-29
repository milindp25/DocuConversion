/**
 * State management hook for the DocuConversion PDF editor.
 * Uses useReducer with an undo/redo history stack to manage
 * annotations, tool selection, zoom, and page navigation.
 */

"use client";

import { useCallback, useReducer, useRef, useEffect } from "react";

import type {
  Annotation,
  ActiveTool,
  EditorState,
} from "@/types/editor";

/** Maximum number of history entries to retain for undo/redo */
const MAX_HISTORY_SIZE = 50;

/** Actions that can be dispatched to the editor reducer */
type EditorAction =
  | { type: "LOAD_FILE"; file: File; fileUrl: string; totalPages: number }
  | { type: "UNLOAD_FILE" }
  | { type: "ADD_ANNOTATION"; annotation: Annotation }
  | { type: "UPDATE_ANNOTATION"; id: string; changes: Partial<Annotation> }
  | { type: "REMOVE_ANNOTATION"; id: string }
  | { type: "SELECT_ANNOTATION"; id: string | null }
  | { type: "SET_ACTIVE_TOOL"; tool: ActiveTool }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAGE"; page: number }
  | { type: "UNDO" }
  | { type: "REDO" };

/** Internal state with undo/redo history */
interface EditorStateWithHistory {
  /** Current editor state */
  present: EditorState;
  /** Past states for undo (most recent at the end) */
  past: EditorState[];
  /** Future states for redo (most recent at the beginning) */
  future: EditorState[];
}

/** Initial editor state before any file is loaded */
const INITIAL_STATE: EditorState = {
  file: null,
  fileUrl: null,
  annotations: [],
  selectedAnnotation: null,
  activeTool: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 100,
};

/** Initial state with empty history stacks */
const INITIAL_STATE_WITH_HISTORY: EditorStateWithHistory = {
  present: INITIAL_STATE,
  past: [],
  future: [],
};

/**
 * Pushes the current state onto the history stack and returns a new state.
 * Limits the past stack to MAX_HISTORY_SIZE entries.
 */
function pushToHistory(
  state: EditorStateWithHistory,
  newPresent: EditorState
): EditorStateWithHistory {
  const past = [...state.past, state.present].slice(-MAX_HISTORY_SIZE);
  return {
    past,
    present: newPresent,
    future: [],
  };
}

/**
 * Reducer for the PDF editor state machine.
 * Handles annotation CRUD, tool selection, navigation, and undo/redo.
 */
function editorReducer(
  state: EditorStateWithHistory,
  action: EditorAction
): EditorStateWithHistory {
  switch (action.type) {
    case "LOAD_FILE":
      return {
        past: [],
        future: [],
        present: {
          ...INITIAL_STATE,
          file: action.file,
          fileUrl: action.fileUrl,
          totalPages: action.totalPages,
          currentPage: 1,
          activeTool: "select",
        },
      };

    case "UNLOAD_FILE":
      return INITIAL_STATE_WITH_HISTORY;

    case "ADD_ANNOTATION":
      return pushToHistory(state, {
        ...state.present,
        annotations: [...state.present.annotations, action.annotation],
        selectedAnnotation: action.annotation.id,
      });

    case "UPDATE_ANNOTATION":
      return pushToHistory(state, {
        ...state.present,
        annotations: state.present.annotations.map((a) =>
          a.id === action.id ? { ...a, ...action.changes } : a
        ),
      });

    case "REMOVE_ANNOTATION":
      return pushToHistory(state, {
        ...state.present,
        annotations: state.present.annotations.filter(
          (a) => a.id !== action.id
        ),
        selectedAnnotation:
          state.present.selectedAnnotation === action.id
            ? null
            : state.present.selectedAnnotation,
      });

    case "SELECT_ANNOTATION":
      return {
        ...state,
        present: {
          ...state.present,
          selectedAnnotation: action.id,
        },
      };

    case "SET_ACTIVE_TOOL":
      return {
        ...state,
        present: {
          ...state.present,
          activeTool: action.tool,
          selectedAnnotation:
            action.tool !== "select" ? null : state.present.selectedAnnotation,
        },
      };

    case "SET_ZOOM": {
      const clampedZoom = Math.max(25, Math.min(400, action.zoom));
      return {
        ...state,
        present: {
          ...state.present,
          zoom: clampedZoom,
        },
      };
    }

    case "SET_PAGE": {
      const clampedPage = Math.max(
        1,
        Math.min(state.present.totalPages, action.page)
      );
      return {
        ...state,
        present: {
          ...state.present,
          currentPage: clampedPage,
        },
      };
    }

    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }

    default:
      return state;
  }
}

/** Return type of the useEditorState hook */
export interface UseEditorStateReturn {
  /** Current editor state */
  state: EditorState;
  /** Add a new annotation to the document */
  addAnnotation: (annotation: Annotation) => void;
  /** Update properties of an existing annotation */
  updateAnnotation: (id: string, changes: Partial<Annotation>) => void;
  /** Remove an annotation by ID */
  removeAnnotation: (id: string) => void;
  /** Select an annotation for editing (or null to deselect) */
  selectAnnotation: (id: string | null) => void;
  /** Switch the active tool */
  setActiveTool: (tool: ActiveTool) => void;
  /** Undo the last annotation change */
  undo: () => void;
  /** Redo a previously undone change */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Set the zoom level (percentage, clamped to 25-400) */
  setZoom: (zoom: number) => void;
  /** Navigate to a specific page (1-indexed, clamped to valid range) */
  setPage: (page: number) => void;
  /** Load a PDF file into the editor */
  loadFile: (file: File, totalPages?: number) => void;
  /** Unload the current file and reset all state */
  unloadFile: () => void;
}

/**
 * Manages the full state of the PDF editor including annotations,
 * tool selection, zoom, page navigation, and undo/redo history.
 *
 * @returns Editor state and action dispatchers
 *
 * @example
 * ```tsx
 * const { state, addAnnotation, undo, redo } = useEditorState();
 * ```
 */
export function useEditorState(): UseEditorStateReturn {
  const [stateWithHistory, dispatch] = useReducer(
    editorReducer,
    INITIAL_STATE_WITH_HISTORY
  );
  const fileUrlRef = useRef<string | null>(null);

  /** Clean up object URL when component unmounts or file changes */
  useEffect(() => {
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    dispatch({ type: "ADD_ANNOTATION", annotation });
  }, []);

  const updateAnnotation = useCallback(
    (id: string, changes: Partial<Annotation>) => {
      dispatch({ type: "UPDATE_ANNOTATION", id, changes });
    },
    []
  );

  const removeAnnotation = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ANNOTATION", id });
  }, []);

  const selectAnnotation = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_ANNOTATION", id });
  }, []);

  const setActiveTool = useCallback((tool: ActiveTool) => {
    dispatch({ type: "SET_ACTIVE_TOOL", tool });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: "SET_ZOOM", zoom });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", page });
  }, []);

  const loadFile = useCallback((file: File, totalPages: number = 1) => {
    // Revoke previous object URL if any
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    fileUrlRef.current = url;
    dispatch({ type: "LOAD_FILE", file, fileUrl: url, totalPages });
  }, []);

  const unloadFile = useCallback(() => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }
    dispatch({ type: "UNLOAD_FILE" });
  }, []);

  return {
    state: stateWithHistory.present,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    selectAnnotation,
    setActiveTool,
    undo,
    redo,
    canUndo: stateWithHistory.past.length > 0,
    canRedo: stateWithHistory.future.length > 0,
    setZoom,
    setPage,
    loadFile,
    unloadFile,
  };
}
