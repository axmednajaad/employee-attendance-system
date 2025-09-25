// import React, { useState } from 'react';
// import { 
//   CheckCircle, 
//   XCircle, 
//   Clock 
// } from 'lucide-react';

// const AttendanceStatusSelector = ({ 
//   employeeId, 
//   date, 
//   status, 
//   onSave,
//   saving 
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
  
//   // Get attendance status options
//   const statusOptions = [
//     { value: 'present', label: 'Present', icon: CheckCircle, color: 'green' },
//     { value: 'absent', label: 'Absent', icon: XCircle, color: 'red' },
//     { value: 'on_leave', label: 'On Leave', icon: Clock, color: 'yellow' }
//   ];

//   // Get the selected option for display
//   const selectedOption = statusOptions.find(option => option.value === status);

//   // Handle status selection
//   const handleSelect = (newStatus) => {
//     onSave(employeeId, date, newStatus);
//     setIsOpen(false);
//   };

//   // Reset status
//   const handleReset = () => {
//     onSave(employeeId, date, '');
//   };

//   if (selectedOption) {
//     return (
//       <div className="relative">
//         <button
//           onClick={handleReset}
//           className={`flex items-center justify-center w-24 h-10 rounded-lg border-2 font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
//             selectedOption.value === 'present' 
//               ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200' 
//               : selectedOption.value === 'absent' 
//               ? 'bg-red-100 border-red-500 text-red-700 hover:bg-red-200' 
//               : 'bg-yellow-100 border-yellow-500 text-yellow-700 hover:bg-yellow-200'
//           }`}
//           disabled={saving}
//           title="Click to reset"
//         >
//           <selectedOption.icon className="h-4 w-4 mr-1" />
//           <span>{selectedOption.label}</span>
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center justify-center w-24 h-10 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
//         disabled={saving}
//       >
//         <span>Select</span>
//       </button>
      
//       {isOpen && (
//         <div className="absolute z-20 mt-1 w-24 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
//           <div className="py-1">
//             {statusOptions.map((option) => {
//               const Icon = option.icon;
//               return (
//                 <button
//                   key={option.value}
//                   onClick={() => handleSelect(option.value)}
//                   className={`flex items-center w-full px-3 py-2 text-sm ${
//                     option.value === 'present' 
//                       ? 'text-green-700 hover:bg-green-100' 
//                       : option.value === 'absent' 
//                       ? 'text-red-700 hover:bg-red-100' 
//                       : 'text-yellow-700 hover:bg-yellow-100'
//                   }`}
//                 >
//                   <Icon className="h-4 w-4 mr-2" />
//                   <span>{option.label}</span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}
      
//       {isOpen && (
//         <div 
//           className="fixed inset-0 z-10" 
//           onClick={() => setIsOpen(false)}
//         ></div>
//       )}
//     </div>
//   );
// };

// export default AttendanceStatusSelector;

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react';

const AttendanceStatusSelector = ({ 
  employeeId, 
  date, 
  status, 
  onSave,
  saving 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get attendance status options
  const statusOptions = [
    { value: 'present', label: 'Present', icon: CheckCircle, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700' },
    { value: 'on_leave', label: 'On Leave', icon: Clock, color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700' }
  ];

  // Get the selected option for display
  const selectedOption = statusOptions.find(option => option.value === status);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle status selection
  const handleSelect = (newStatus) => {
    onSave(employeeId, date, newStatus);
    setIsOpen(false);
  };

  // Reset status
  const handleReset = () => {
    onSave(employeeId, date, '');
    setIsOpen(false);
  };

  if (selectedOption) {
    const Icon = selectedOption.icon;
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-28 h-9 rounded-lg border font-medium text-sm transition-all duration-200 hover:shadow-md ${
            selectedOption.bgColor + ' ' + selectedOption.borderColor + ' ' + selectedOption.textColor
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={saving}
        >
          <div className="flex items-center px-2">
            <Icon className="h-4 w-4 mr-2" />
            <span className="truncate">{selectedOption.label}</span>
          </div>
          <MoreVertical className="h-3 w-3 mr-1 opacity-60" />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 w-40 rounded-lg shadow-xl bg-white border border-gray-200 transform origin-top-right">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                Change Status
              </div>
              {statusOptions.map((option) => {
                const OptionIcon = option.icon;
                if (option.value === status) return null; // Don't show current status as option
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex items-center w-full px-3 py-2 text-sm transition-colors duration-150 ${
                      option.textColor + ' hover:' + option.bgColor
                    }`}
                  >
                    <OptionIcon className="h-4 w-4 mr-3" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
              {/* <div className="border-t border-gray-100 mt-1">
                <button
                  onClick={handleReset}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150"
                >
                  <span className="ml-7">Clear Selection</span>
                </button>
              </div> */}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-28 h-9 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 font-medium text-sm"
        disabled={saving}
      >
        <span>Select</span>
        <MoreVertical className="h-3 w-3 ml-1 opacity-60" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-40 rounded-lg shadow-xl bg-white border border-gray-200 transform origin-top-right">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              Select Status
            </div>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center w-full px-3 py-2 text-sm transition-colors duration-150 ${
                    option.textColor + ' hover:' + option.bgColor
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStatusSelector;
