import { css } from "@emotion/react";

const Switch = ({ isActive, onClick, label }) => {
  const switchElement = (
    <button
      style={{
        transition: "background 20ms ease-in",
        cursor: "pointer",
        borderRadius: "4.4rem",
        outline: "none",
        pointerEvents: "all",
      }}
      onClick={onClick}
    >
      <div
        style={{
          display: "flex",
          height: "1.4rem",
          width: "2.6rem",
          borderRadius: "4.4rem",
          padding: "0.2rem",
          boxSizing: "content-box",
          background: isActive
            ? "rgb(46, 170, 220)"
            : "rgba(202, 204, 206, 0.3)",
          transition: "background 200ms ease, box-shadow 200ms ease",
        }}
      >
        <div
          style={{
            width: "1.4rem",
            height: "1.4rem",
            borderRadius: "4.4rem",
            background: "white",
            transition: "transform 200ms ease-out, background 200ms ease-out",
            transform: `translateX(${isActive ? "1.2rem" : 0})`,
          }}
        />
      </div>
    </button>
  );

  if (label == null) return switchElement;

  return (
    <label
      css={(theme) =>
        css({
          display: "grid",
          gridTemplateColumns: "auto auto",
          gridGap: "1rem",
          alignItems: "center",
          padding: "0.4rem 0.8rem",
          minHeight: "3.2rem",
          cursor: "pointer",
          fontSize: theme.fontSizes.default,
          pointerEvents: "all",
        })
      }
    >
      <div>{label}</div>
      {switchElement}
    </label>
  );
};

export default Switch;
