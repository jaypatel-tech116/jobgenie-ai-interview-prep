import React from "react";
import styles from "./Skeleton.module.scss";

export const SkeletonBlock = ({ width = "100%", height = "20px", borderRadius = "4px", className = "" }) => {
  return (
    <div
      className={`${styles.skeletonBlock} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
};
