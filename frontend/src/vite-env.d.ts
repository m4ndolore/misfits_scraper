// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module '*.json' {
    const value: any;
    export default value;
}