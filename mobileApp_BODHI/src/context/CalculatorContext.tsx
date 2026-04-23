import React, { createContext, useState, useContext } from 'react';

interface CalculatorContextType {
  isCalculatorVisible: boolean;
  showCalculator: () => void;
  hideCalculator: () => void;
  toggleCalculator: () => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export const CalculatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);

  const showCalculator = () => setIsCalculatorVisible(true);
  const hideCalculator = () => setIsCalculatorVisible(false);
  const toggleCalculator = () => setIsCalculatorVisible(prev => !prev);

  return (
    <CalculatorContext.Provider value={{ isCalculatorVisible, showCalculator, hideCalculator, toggleCalculator }}>
      {children}
    </CalculatorContext.Provider>
  );
};

export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
};
