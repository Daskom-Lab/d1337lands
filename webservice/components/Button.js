import styles from "./Button.module.css";

export default function Button({ text, color, onClick }) {
  return (
    <button className={styles.pushable} onClick={onClick}>
      <span className={styles.shadow}></span>
      <span
        className={`${styles.edge} ${{
          red: styles.edge_red,
          yellow: styles.edge_yellow,
          green: styles.edge_green,
        }[color]}`}
      ></span>
      <span className={`${styles.front} ${{
          red: styles.front_red,
          yellow: styles.front_yellow,
          green: styles.front_green,
        }[color]}`}>{text}</span>
    </button>
  );
}
