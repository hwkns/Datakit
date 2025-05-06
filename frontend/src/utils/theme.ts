export const applyThemeColor = (hexColor: string) => {
  const root = document.documentElement;

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Find the min and max values to determine hue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    // Calculate saturation
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

    // Calculate hue
    if (max === r) {
      h = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }
    h = Math.round(h * 60);
  }

  // Calculate saturation percentage
  s = Math.round(s * 100);

  // Calculate lightness percentage
  const lPercentage = Math.round(l * 100);

  // Update CSS Variables
  root.style.setProperty("--primary", `hsl(${h} ${s}% ${lPercentage}%)`);
  root.style.setProperty("--ring", `hsl(${h} ${s}% ${lPercentage}%)`);
};
