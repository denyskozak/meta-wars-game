"use client";

import React, { useEffect, useState } from "react";

interface DeveloperPanelProps {
  models?: Record<string, any>;
}

export const DeveloperPanel = ({ models = {} }: DeveloperPanelProps) => {
  const [modelList, setModelList] = useState<string[]>([]);
  const [scale, setScale] = useState(0.4);
  const [model, setModel] = useState("");

  useEffect(() => {
    if (models && Object.keys(models).length) {
      setModelList(
        Object.keys(models).filter((key) => !key.endsWith("_animations")),
      );
    } else {
      fetch("/api/models")
        .then((res) => res.json())
        .then((data) => setModelList(data.models || []))
        .catch(() => {});
    }
  }, [models]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("DEV_SCALE_CHANGE", { detail: { scale } }),
    );
  }, [scale]);

  useEffect(() => {
    if (model) {
      window.dispatchEvent(
        new CustomEvent("DEV_MODEL_CHANGE", { detail: { model } }),
      );
    }
  }, [model]);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.7)",
        padding: "10px",
        zIndex: 1000,
        color: "white",
      }}
    >
      <h4 className="mb-2 font-bold">Developer Panel</h4>
      <div className="mb-2">
        <label className="mr-2" htmlFor="dev-scale-slider">
          Scale
        </label>
        <input
          id="dev-scale-slider"
          max="2"
          min="0.1"
          step="0.1"
          type="range"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
        />
        <span className="ml-2">{scale.toFixed(1)}</span>
      </div>
      <div>
        <label className="mr-2" htmlFor="dev-model-select">
          Model
        </label>
        <select
          id="dev-model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="">select</option>
          {modelList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
