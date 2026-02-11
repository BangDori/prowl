/** 정적 에셋 import 타입 선언 */
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
