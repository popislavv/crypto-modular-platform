export default function Card({ children }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow border border-gray-700">
      {children}
    </div>
  );
}
