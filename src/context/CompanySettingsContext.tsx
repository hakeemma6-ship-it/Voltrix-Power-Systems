import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompanySettings {
  id?: string;
  companyName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  stateCode?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  branch?: string;
  upiId?: string;
  warrantyTerms?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
}

export const defaultCompanySettings: CompanySettings = {
  companyName: 'Voltrix Power Systems',
  logo: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866628/voltrix_power_systems/logo.png',
  address: '',
  phone: '',
  email: '',
  gstin: '',
  state: '',
};

interface ContextType {
  settings: CompanySettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const CompanySettingsContext = createContext<ContextType>({
  settings: defaultCompanySettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export const CompanySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(defaultCompanySettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }));
        }
      }
    } catch (e) {
      console.error('Failed to load company settings from database:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <CompanySettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </CompanySettingsContext.Provider>
  );
};

export const useCompanySettings = () => useContext(CompanySettingsContext);
