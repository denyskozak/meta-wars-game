"use client";

import React, { useEffect, useState } from "react";

interface DeveloperPanelProps {
  /**
   * List of available models. Can be provided either as an object of loaded
   * models, an array of file paths, or an array of objects containing a `path`
   * field.
   */
  models?: Record<string, any> | Array<{ path: string } | string>;
}

export const DeveloperPanel = ({ models = {} }: DeveloperPanelProps) => {
  const [modelList, setModelList] = useState<string[]>([]);
  const [scale, setScale] = useState(0.5);
  const [model, setModel] = useState("");
  const [cameraOffset, setCameraOffset] = useState(() => ({
    x: window.CAMERA_OFFSET?.x ?? 1.5,
    y: window.CAMERA_OFFSET?.y ?? 1.0,
    z: window.CAMERA_OFFSET?.z ?? -3.5,
  }));
  const [lookAtOffset, setLookAtOffset] = useState(() => ({
    x: window.LOOK_AT_OFFSET?.x ?? 0,
    y: window.LOOK_AT_OFFSET?.y ?? 1.5,
    z: window.LOOK_AT_OFFSET?.z ?? 0,
  }));

  useEffect(() => {
    if (Array.isArray(models) && models.length) {
      const list = models
        .map((m) => (typeof m === "string" ? m : m.path))
        .filter(Boolean);

      setModelList(list);
    } else if (models && Object.keys(models).length) {
      setModelList(
        Object.keys(models).filter((key) => !key.endsWith("_animations")),
      );
    }
  }, [models]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("DEV_SCALE_CHANGE", { detail: { scale } }),
    );
  }, [scale]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("DEV_CAMERA_OFFSET_CHANGE", { detail: cameraOffset }),
    );
  }, [cameraOffset]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("DEV_LOOKAT_OFFSET_CHANGE", { detail: lookAtOffset }),
    );
  }, [lookAtOffset]);

  useEffect(() => {
    if (model) {
      console.log("model: ", model);
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
          max="0.5"
          min="0.00001"
          step="0.00001"
          type="range"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
        />
        <span className="ml-2">{scale}</span>
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
      <div className="mt-2">
        <h5>Camera Offset</h5>
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis} className="mb-1">
            <label className="mr-2" htmlFor={`camera-offset-${axis}`}>
              {axis.toUpperCase()}
            </label>
            <input
              id={`camera-offset-${axis}`}
              step="0.1"
              type="number"
              value={cameraOffset[axis]}
              onChange={(e) =>
                setCameraOffset({
                  ...cameraOffset,
                  [axis]: parseFloat(e.target.value),
                })
              }
            />
          </div>
        ))}
      </div>
      <div className="mt-2">
        <h5>LookAt Offset</h5>
        {(["x", "y", "z"] as const).map((axis) => (
          <div key={axis} className="mb-1">
            <label className="mr-2" htmlFor={`lookat-offset-${axis}`}>
              {axis.toUpperCase()}
            </label>
            <input
              id={`lookat-offset-${axis}`}
              step="0.1"
              type="number"
              value={lookAtOffset[axis]}
              onChange={(e) =>
                setLookAtOffset({
                  ...lookAtOffset,
                  [axis]: parseFloat(e.target.value),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
