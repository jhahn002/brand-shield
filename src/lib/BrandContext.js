'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const BrandContext = createContext(null);

/**
 * Provides org_id and brand_id to the entire app.
 * For now, reads from localStorage or URL params.
 * Will be replaced by auth/JWT-based org selection later.
 */
export function BrandProvider({ children }) {
  const [orgId, setOrgId] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [brandName, setBrandName] = useState('');

  // On mount, read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('brandshield_context');
    if (stored) {
      try {
        const ctx = JSON.parse(stored);
        if (ctx.orgId) setOrgId(ctx.orgId);
        if (ctx.brandId) setBrandId(ctx.brandId);
        if (ctx.brandName) setBrandName(ctx.brandName);
      } catch {}
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (orgId && brandId) {
      localStorage.setItem('brandshield_context', JSON.stringify({
        orgId, brandId, brandName,
      }));
    }
  }, [orgId, brandId, brandName]);

  const selectBrand = (org, brand, name) => {
    setOrgId(org);
    setBrandId(brand);
    setBrandName(name || '');
  };

  return (
    <BrandContext.Provider value={{ orgId, brandId, brandName, selectBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandContext() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrandContext must be inside BrandProvider');
  return ctx;
}
