"use client"

import React, { useState } from "react";
import subjects from "./subjects.json";

type Node = { id: number; name: string; subtopics?: Node[] };
type Resource = { label: string; url: string };
type Subject = {
    id: number;
    name: string;
    topics: Node[];
    resources: Resource[];
};

export default function SyllabusPage() {
    const [openRowId, setOpenRowId] = useState<number | null>(null);
    const [openResourceId, setOpenResourceId] = useState<number | null>(null);
    // store checked state for leaf subtopics keyed as "subject:path" e.g. "1:2:3"
    const [checkedLeaves, setCheckedLeaves] = useState<Record<string, boolean>>({});
    // track which nodes are open; key: "subject:path"
    const [openNodeMap, setOpenNodeMap] = useState<Record<string, boolean>>({});

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
                        {(subjects as Subject[]).map((subj) => (
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