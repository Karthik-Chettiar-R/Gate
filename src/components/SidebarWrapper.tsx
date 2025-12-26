"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      {!open && (
        <button
          aria-label="Toggle sidebar"
          onClick={() => setOpen((v) => !v)}
          className="absolute top-4 left-4 z-50 p-2 rounded-md bg-white/5 hover:bg-white/10"
        >
          <img src="/sidebar-icon-19.jpg" alt="sidebar" className="w-10 h-10" />
        </button>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-black text-white transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <button
            onClick={() => setOpen(false)}
            className="mb-4 px-2 py-1 rounded bg-white/5 hover:bg-white/10"
            
          >
            <img src="/goback-button.png" alt="close sidebar" className="w-10 h-10" />
          </button>
          <nav className="mt-4 flex flex-col gap-2">
            <Link href="/syllabus" className="px-2 py-1 rounded hover:bg-white/5">
              Syllabus
            </Link>
          </nav>
        </div>
      </aside>

      <div className={`${open ? "pl-64" : ""} transition-all duration-300`}>{children}</div>
    </div>
  );
}
