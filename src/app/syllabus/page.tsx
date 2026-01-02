"use client"

import React, { useState, useEffect } from "react";
import subjects from "./subjects.json";

type Node = { id: number; name: string; subtopics?: Node[] };
type Resource = { label: string; url: string };
type Subject = {
    id: number;
    name: string;
    topics: Node[];
    resources: Resource[];
};

// Raw shapes from subjects.json (support both `items` and `children` keys)
type RawItem = { id: number; name: string; children?: RawItem[]; items?: RawItem[] };
type RawTopic = { id: number; name: string; items?: RawItem[]; subtopics?: RawItem[] };
type RawSubject = { id: number; name: string; topics?: RawTopic[]; resources?: Resource[] };

function normalizeNodes(items?: RawItem[] | undefined): Node[] {
    if (!items || items.length === 0) return [];
    return items.map((it) => ({ id: it.id, name: it.name, subtopics: normalizeNodes(it.children ?? it.items) }));
}

const normalizedSubjects: Subject[] = (subjects as RawSubject[]).map((s) => ({
    id: s.id,
    name: s.name,
    topics: (s.topics ?? []).map((t) => ({ id: t.id, name: t.name, subtopics: normalizeNodes(t.items ?? t.subtopics) })),
    resources: s.resources ?? [],
}));

export default function SyllabusPage() {
    const [openRowId, setOpenRowId] = useState<number | null>(null);
    const [openResourceId, setOpenResourceId] = useState<number | null>(null);
    // store checked state for leaf subtopics keyed as "subject:path" e.g. "1:2:3"
    const [checkedLeaves, setCheckedLeaves] = useState<Record<string, boolean>>({});
    // track which nodes are open; key: "subject:path"
    const [openNodeMap, setOpenNodeMap] = useState<Record<string, boolean>>({});

    // persist checked leaves and open node map between sessions using
    // localStorage with a cookie fallback (also write a cookie for cross-tab visibility)
    useEffect(() => {
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem("syllabus_checked_leaves_v1") : null;
            if (raw) {
                setCheckedLeaves(JSON.parse(raw));
            } else if (typeof document !== "undefined") {
                const m = document.cookie.match('(^|;)\\s*syllabus_checked_leaves=([^;]+)');
                if (m && m[2]) setCheckedLeaves(JSON.parse(decodeURIComponent(m[2])));
            }

            const rawOpen = typeof window !== "undefined" ? localStorage.getItem("syllabus_open_node_map_v1") : null;
            if (rawOpen) {
                setOpenNodeMap(JSON.parse(rawOpen));
            } else if (typeof document !== "undefined") {
                const m2 = document.cookie.match('(^|;)\\s*syllabus_open_node_map=([^;]+)');
                if (m2 && m2[2]) setOpenNodeMap(JSON.parse(decodeURIComponent(m2[2])));
            }
        } catch (err) {
            console.error("Failed to load persisted syllabus state", err);
        }
    }, []);

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem("syllabus_checked_leaves_v1", JSON.stringify(checkedLeaves));
            }
            if (typeof document !== "undefined") {
                document.cookie = `syllabus_checked_leaves=${encodeURIComponent(JSON.stringify(checkedLeaves))}; path=/; max-age=${60 * 60 * 24 * 365}`;
            }
        } catch (err) {
            console.error("Failed to persist checkedLeaves", err);
        }
    }, [checkedLeaves]);

    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem("syllabus_open_node_map_v1", JSON.stringify(openNodeMap));
            }
            if (typeof document !== "undefined") {
                document.cookie = `syllabus_open_node_map=${encodeURIComponent(JSON.stringify(openNodeMap))}; path=/; max-age=${60 * 60 * 24 * 365}`;
            }
        } catch (err) {
            console.error("Failed to persist openNodeMap", err);
        }
    }, [openNodeMap]);

    // helper to build a key from subject id and path of node ids
    function nodeKey(subjectId: number, path: number[]) {
        return `${subjectId}:${path.join(":")}`;
    }

    // collect leaf keys for a node (descendants that have no subtopics)
    function collectLeafKeys(node: Node, subjectId: number, path: number[]): string[] {
        const currentPath = [...path, node.id];
        if (!node.subtopics || node.subtopics.length === 0) {
            return [nodeKey(subjectId, currentPath)];
        }
        return node.subtopics.flatMap((child) => collectLeafKeys(child, subjectId, currentPath));
    }

    function isNodeFullyChecked(subjectId: number, path: number[], node: Node) {
        const leafKeys = collectLeafKeys(node, subjectId, path);
        if (leafKeys.length === 0) return false;
        return leafKeys.every((k) => !!checkedLeaves[k]);
    }

    function setAllDescendants(subjectId: number, path: number[], node: Node, value: boolean) {
        const leafKeys = collectLeafKeys(node, subjectId, path);
        setCheckedLeaves((c) => {
            const next = { ...c };
            leafKeys.forEach((k) => (next[k] = value));
            return next;
        });
    }

    function toggleLeaf(subjectId: number, path: number[], leafId: number) {
        const k = nodeKey(subjectId, [...path, leafId]);
        setCheckedLeaves((c) => ({ ...c, [k]: !c[k] }));
    }

    function toggleNodeOpen(subjectId: number, path: number[], nodeId: number) {
        const k = nodeKey(subjectId, [...path, nodeId]);
        setOpenNodeMap((m) => ({ ...m, [k]: !m[k] }));
    }

    function toggleRow(id: number) {
        setOpenResourceId(null); // close resources when opening a row
        setOpenRowId((prev) => (prev === id ? null : id));
    }

    function toggleResource(id: number) {
        setOpenRowId(null); // close row topics when opening resources
        setOpenResourceId((prev) => (prev === id ? null : id));
    }

    

    return (
        <div className="p-6 pl-16 sm:pl-20 md:pl-24">
            <h1 className="mb-4 text-2xl font-semibold">Syllabus</h1>

            <div className="overflow-hidden rounded border">
                <table className="w-full table-fixed">
                    <thead className="bg-gray-100/50">
                        <tr>
                            <th className="text-left px-4 py-3">Subject</th>
                            <th className="text-right px-4 py-3">Resources</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(normalizedSubjects as Subject[]).map((subj) => (
                            <React.Fragment key={subj.id}>
                                <tr
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10"
                                    onClick={() => toggleRow(subj.id)}
                                >
                                    <td className="px-4 py-3">{subj.name}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleResource(subj.id);
                                            }}
                                            className="inline-flex items-center gap-2 rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
                                        >
                                            Resources
                                        </button>
                                    </td>
                                </tr>

                                {/* Topics accordion row */}
                                {openRowId === subj.id && (
                                    <tr>
                                        <td colSpan={2} className="bg-gray-50 dark:bg-white/6 px-4 py-2">
                                            <div className="space-y-2">
                                                        {/** Recursive renderer for arbitrary nesting */}
                                                        {function renderNodes(nodes: Node[], path: number[] = []) {
                                                            return nodes.map((n) => {
                                                                const key = nodeKey(subj.id, [...path, n.id]);
                                                                const fully = isNodeFullyChecked(subj.id, path, n);
                                                                const hasChildren = !!n.subtopics && n.subtopics.length > 0;
                                                                return (
                                                                    <div key={key} className="space-y-1">
                                                                        <div
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (hasChildren) toggleNodeOpen(subj.id, path, n.id);
                                                                            }}
                                                                            className="flex items-center justify-between gap-3 rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/8"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={fully}
                                                                                    onChange={(e) => {
                                                                                        e.stopPropagation();
                                                                                        if (hasChildren) {
                                                                                            setAllDescendants(subj.id, path, n, !fully);
                                                                                        } else {
                                                                                            // leaf
                                                                                            toggleLeaf(subj.id, path, n.id);
                                                                                        }
                                                                                    }}
                                                                                    className="h-4 w-4"
                                                                                />
                                                                                <div>{n.name}</div>
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">{hasChildren ? (openNodeMap[key] ? '▾' : '▸') : ''}</div>
                                                                        </div>

                                                                        {hasChildren && openNodeMap[key] && (
                                                                            <div className="ml-6 space-y-1 pb-2">
                                                                                {renderNodes(n.subtopics!, [...path, n.id])}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            });
                                                        }(subj.topics)}
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Resources accordion row */}
                                {openResourceId === subj.id && (
                                    <tr>
                                        <td colSpan={2} className="bg-gray-50 dark:bg-white/6 px-4 py-2">
                                            <div className="space-y-2">
                                                {subj.resources.map((r, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/8"
                                                    >
                                                        <a
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {r.label}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}