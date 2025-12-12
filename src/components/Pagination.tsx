import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function Pagination({
  rowsPerPage,
  rowCount,
  onChangePage,
  currentPage,
}: any) {
  const totalPages = rowCount > 0 ? Math.ceil(rowCount / rowsPerPage) : 0;
  const safeCurrentPage = totalPages === 0 ? 0 : currentPage;
  const start = rowCount === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const end = rowCount === 0 ? 0 : Math.min(safeCurrentPage * rowsPerPage, rowCount);

  const handlePrev = () => {
    if (currentPage > 1) onChangePage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onChangePage(currentPage + 1);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 bg-white text-sm text-gray-600">
      {/* Left side text */}
      <div className="mb-2 sm:mb-0">
        Showing <span className="font-medium">{start}</span> to{" "}
        <span className="font-medium">{end}</span> of{" "}
        <span className="font-medium">{rowCount}</span> results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Prev Button */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition 
            ${
              currentPage === 1
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Numbered Pages */}
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onChangePage(i + 1)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition 
              ${
                currentPage === i + 1
                  ? "bg-blue-800 text-white border-blue-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
          >
            {i + 1}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition 
            ${
              currentPage === totalPages || totalPages === 0
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
