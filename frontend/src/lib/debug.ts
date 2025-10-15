export const logComponentRender = (
  componentName: string,
  context?: Record<string, unknown>,
) => {
  if (process.env.NODE_ENV !== "production") {
    if (context) {
      console.debug(`[${componentName}] render`, context);
    } else {
      console.debug(`[${componentName}] render`);
    }
  }
};
