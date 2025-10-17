declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: { ref?: <T extends HTMLElement>(e: T) => void } & { [key: string]: any };
  }
}