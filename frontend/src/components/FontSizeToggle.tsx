import { FontSize } from "../types/FontSize";

interface FontSizeToggleProps {
  currentSize: FontSize;
  onChange: (size: FontSize) => void;
}

const FontSizeToggle: React.FC<FontSizeToggleProps> = ({ currentSize, onChange }) => {
  return (
    <div className="flex gap-3 justify-end">
      <button
        className={`appearance-none border-none px-4 py-2 rounded-md text-lg ${currentSize === "small" ? "bg-yellow-600 text-white" : "bg-gray-700 text-yellow-300 hover:bg-gray-600"}`}
        onClick={() => onChange("small")}
      >
        Small
      </button>
      <button
        className={`appearance-none border-none px-4 py-2 rounded-md text-lg ${currentSize === "medium" ? "bg-yellow-600 text-white" : "bg-gray-700 text-yellow-300 hover:bg-gray-600"}`}
        onClick={() => onChange("medium")}
      >
        Medium
      </button>
      <button
        className={`appearance-none border-none px-4 py-2 rounded-md text-lg ${currentSize === "large" ? "bg-yellow-600 text-white" : "bg-gray-700 text-yellow-300 hover:bg-gray-600"}`}
        onClick={() => onChange("large")}
      >
        Large
      </button>
    </div>
  );
};

export default FontSizeToggle;