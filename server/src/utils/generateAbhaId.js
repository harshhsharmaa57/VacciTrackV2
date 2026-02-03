// Generate ABHA ID (14-digit simulated)
export const generateAbhaId = () => {
  return Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
};


